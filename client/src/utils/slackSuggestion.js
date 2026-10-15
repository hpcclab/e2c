import { isConnectedToMachine } from "./connections.js";
import {
  getMachineEetMean,
  getMachineEetStdDev,
  sourceEetKey,
} from "./executionTime.js";
import { getSourceEdgeNetwork } from "./edgeNetwork.js";
import { calculateTravelTime } from "./networkDelay.js";
import { createRandomGenerator } from "./randomSeed.js";
import { sampleGenerationTimes } from "./workloadGeneration.js";
import { SimulationEngine } from "./simulationEngine.js";

// A one-sided 95th percentile gives the task a 95% chance of fitting within
// the suggested slack when data size and EET follow their configured normals.
export const SUGGESTED_SLACK_Z_SCORE = 1.645;
export const SUGGESTED_SLACK_TARGET = 0.95;
export const SUGGESTED_SLACK_PADDING_SECONDS = 0.01;
const SUGGESTION_SEED = "e2c-slack-suggestion";

function nonNegativeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
}

function roundUpHundredth(value) {
  return Math.ceil((value - Number.EPSILON) * 100) / 100;
}

function sourceNodeId(sourceId) {
  return String(sourceId).startsWith("nd_")
    ? String(sourceId)
    : `nd_${sourceId}`;
}

function taskCount(source, fallback = 0) {
  const count = Math.floor(Number(source?.properties?.numTasks));
  return Number.isFinite(count) && count > 0 ? count : fallback;
}

function mergeCurrentSource(source, sources) {
  const merged = new Map();
  (sources || []).forEach((candidate) => {
    if (candidate?.id !== undefined && candidate?.id !== null) {
      merged.set(String(candidate.id), candidate);
    }
  });
  merged.set(String(source.id), source);
  return [...merged.values()];
}

function percentile(values, probability) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(
    0,
    Math.min(sorted.length - 1, Math.ceil(probability * sorted.length) - 1),
  );
  return sorted[index];
}

function conservativeDuration(machine, source) {
  const taskType = source.properties?.task_type ?? source.name ?? "";
  return (
    getMachineEetMean(machine, source.id, taskType) +
    SUGGESTED_SLACK_Z_SCORE *
      getMachineEetStdDev(machine, source.id, taskType)
  );
}

function buildConservativeTasks(
  sources,
  machines,
  edges,
  nodes,
  targetSourceId,
  simulationSeed,
) {
  const tasks = [];
  for (const source of sources) {
    const count = taskCount(source);
    if (!count) continue;

    const connected = machines.some((machine) =>
      isConnectedToMachine(sourceNodeId(source.id), machine.id, edges, nodes),
    );
    // An unreachable source cannot contend for a machine queue.
    if (!connected) continue;

    const properties = source.properties ?? {};
    const start = nonNegativeNumber(properties.startTime);
    const end = Math.max(start, nonNegativeNumber(properties.endTime, start));
    const random = createRandomGenerator(
      simulationSeed || SUGGESTION_SEED,
      `slack-arrival:${source.id}`,
    );
    const generationTimes = sampleGenerationTimes(
      start,
      end,
      count,
      properties.distribution ?? "uniform",
      random,
    );
    const conservativeSize =
      nonNegativeNumber(properties.meanSize) +
      SUGGESTED_SLACK_Z_SCORE *
        nonNegativeNumber(properties.dataSizeStdDev ?? properties.stdv);
    const network = getSourceEdgeNetwork(source.id, edges, properties);
    const travelTime = calculateTravelTime(
      conservativeSize,
      network.networkType,
      network.dataRateKbps,
    );

    generationTimes.forEach((generationTime) => {
      tasks.push({
        task_type: properties.task_type ?? source.name ?? "",
        source_id: source.id,
        generation_time: generationTime,
        arrival_time: Number((generationTime + travelTime).toFixed(6)),
        travel_time: travelTime,
        data_size: conservativeSize,
        status: "NEW",
        // The dry run predicts completion without dropping work early.
        deadline: Number.MAX_SAFE_INTEGER,
        start_time: null,
        end_time: null,
      });
    });
  }
  return tasks.sort((a, b) => {
    const arrivalDifference = a.arrival_time - b.arrival_time;
    if (arrivalDifference) return arrivalDifference;
    // When tasks arrive simultaneously, place the source being estimated
    // behind competing sources. This avoids an optimistic suggestion that is
    // only safe because of incidental array order.
    const aIsTarget = String(a.source_id) === String(targetSourceId);
    const bIsTarget = String(b.source_id) === String(targetSourceId);
    if (aIsTarget !== bIsTarget) return aIsTarget ? 1 : -1;
    return 0;
  });
}

function conservativeMachines(machines, sources) {
  return machines.map((machine) => {
    const eet = { ...(machine.eet ?? {}) };
    const eetStdDev = { ...(machine.eetStdDev ?? {}) };
    sources.forEach((source) => {
      const key = sourceEetKey(source.id);
      eet[key] = conservativeDuration(machine, source);
      eetStdDev[key] = 0;
    });
    return {
      ...machine,
      eet,
      eetStdDev,
      // Slack cannot compensate for an empty battery. The suggestion models
      // timing only; battery failures remain separately identified in reports.
      energySource: "Grid-Powered",
      queue: [],
    };
  });
}

function calculateQueueAwareSuggestion({
  source,
  sources,
  machines,
  edges,
  nodes,
  policyAlias,
  simulationSeed,
}) {
  const allSources = mergeCurrentSource(source, sources);
  const tasks = buildConservativeTasks(
    allSources,
    machines,
    edges,
    nodes,
    source.id,
    simulationSeed,
  );
  const ownTaskCount = tasks.filter(
    (task) => String(task.source_id) === String(source.id),
  ).length;
  if (!ownTaskCount) return null;

  const simulatedMachines = conservativeMachines(machines, allSources);
  const engine = new SimulationEngine({
    policyAlias,
    deadlinePolicy: "continue",
    machines: simulatedMachines,
    iot: allSources.map((candidate) => ({
      ...candidate,
      properties: {
        ...candidate.properties,
        energySource: "Grid-Powered",
      },
    })),
    tasks,
    edges,
    nodes,
    random: createRandomGenerator(
      simulationSeed || SUGGESTION_SEED,
      "slack-scheduler",
    ),
  });

  // This is computation only—there is no timer or animation. The guard avoids
  // blocking the UI if malformed input makes a scheduler unable to progress.
  const latestGeneration = Math.max(
    0,
    ...tasks.map((task) => nonNegativeNumber(task.generation_time)),
  );
  const longestExecution = Math.max(
    0,
    ...simulatedMachines.flatMap((machine) =>
      allSources.map((candidate) =>
        getMachineEetMean(
          machine,
          candidate.id,
          candidate.properties?.task_type ?? candidate.name ?? "",
        ),
      ),
    ),
  );
  const maximumSteps = Math.max(
    10_000,
    Math.ceil((latestGeneration + tasks.length * longestExecution + 10) * 100),
  );
  let steps = 0;
  while (!engine.isComplete() && steps < maximumSteps) {
    engine.step();
    steps += 1;
  }
  if (!engine.isComplete()) return null;

  const ownResults = engine
    .getSnapshot()
    .results.filter(
      (task) =>
        String(task.source_id) === String(source.id) &&
        Number.isFinite(Number(task.end_time)),
    );
  if (ownResults.length !== ownTaskCount) return null;

  const requiredWindows = ownResults.map(
    (task) => Number(task.end_time) - Number(task.generation_time),
  );
  const requiredSlack = percentile(
    requiredWindows,
    SUGGESTED_SLACK_TARGET,
  );
  if (!Number.isFinite(requiredSlack)) return null;

  const isolated = calculateIsolatedSuggestion(source, machines, edges, nodes);
  return {
    ...isolated,
    slack: roundUpHundredth(
      Math.max(0, requiredSlack) + SUGGESTED_SLACK_PADDING_SECONDS,
    ),
    queueAware: true,
    predictedTasks: ownResults.length,
    targetCompletionRate: SUGGESTED_SLACK_TARGET,
  };
}

function calculateIsolatedSuggestion(source, machines, edges, nodes) {
  const sourceId = sourceNodeId(source.id);
  const connectedMachines = machines.filter((machine) =>
    isConnectedToMachine(sourceId, machine.id, edges, nodes),
  );
  if (connectedMachines.length === 0) return null;

  const properties = source.properties;
  const dataSizeMean = nonNegativeNumber(properties.meanSize);
  const dataSizeStdDev = nonNegativeNumber(
    properties.dataSizeStdDev ?? properties.stdv,
  );
  const conservativeDataSize =
    dataSizeMean + SUGGESTED_SLACK_Z_SCORE * dataSizeStdDev;
  const { dataRateKbps } = getSourceEdgeNetwork(source.id, edges, properties);
  const transferTime = (conservativeDataSize * 8) / dataRateKbps;

  const executionTimes = connectedMachines.map((machine) =>
    conservativeDuration(machine, source),
  );
  const executionTime = Math.max(...executionTimes);
  const exactSlack = transferTime + executionTime;

  return {
    slack: roundUpHundredth(exactSlack),
    transferTime,
    executionTime,
    connectedMachineCount: connectedMachines.length,
    queueAware: false,
  };
}

export function shouldApplySlackSuggestion({
  locked = false,
  lastAppliedSuggestion = null,
  lastStoredSuggestion = null,
  suggestedSlack,
  force = false,
}) {
  if (locked) return false;
  if (force) return true;
  const storedSuggestion = Number(lastStoredSuggestion);
  const hasStoredSuggestion =
    lastStoredSuggestion !== null &&
    lastStoredSuggestion !== undefined &&
    lastStoredSuggestion !== "" &&
    Number.isFinite(storedSuggestion);
  return (
    lastAppliedSuggestion !== suggestedSlack &&
    (!hasStoredSuggestion || storedSuggestion !== Number(suggestedSlack))
  );
}

export function calculateSuggestedSlack({
  source,
  sources = [],
  machines = [],
  edges = [],
  nodes = [],
  policyAlias = "FCFS",
  simulationSeed = "",
}) {
  if (!source?.properties || source.id === undefined || source.id === null) {
    return null;
  }

  const isolated = calculateIsolatedSuggestion(source, machines, edges, nodes);
  if (!isolated) return null;

  // Older/imported sources may not contain generation settings. Preserve the
  // useful isolated-task estimate until a workload has been configured.
  if (!taskCount(source)) return isolated;

  return (
    calculateQueueAwareSuggestion({
      source,
      sources,
      machines,
      edges,
      nodes,
      policyAlias,
      simulationSeed,
    }) ?? isolated
  );
}
