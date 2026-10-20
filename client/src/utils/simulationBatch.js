import { buildTaskSummary } from "./reportStats.js";
import { ENERGY_FAILURE_REASONS } from "./energy.js";
import { normalizeRandomSeed } from "./randomSeed.js";

export const MAX_SIMULATION_RUNS = 20;
export const MAX_BATCH_TASKS = 50_000;
export const MAX_BACKGROUND_WORKERS = 3;

export function normalizeSimulationRunCount(value) {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.min(MAX_SIMULATION_RUNS, parsed));
}

export function normalizeSimulationSeeds(runCount, seeds = [], fallback = "") {
  const count = normalizeSimulationRunCount(runCount);
  const baseSeed = normalizeRandomSeed(seeds[0] ?? fallback);
  return Array.from({ length: count }, (_, index) => {
    if (seeds[index] !== undefined) {
      const seed = normalizeRandomSeed(seeds[index]);
      const legacyGeneratedSeed =
        index > 0 && baseSeed ? `${baseSeed}-run-${index + 1}` : "";
      return seed === legacyGeneratedSeed ? "" : seed;
    }
    if (index === 0) return normalizeRandomSeed(fallback);
    return "";
  });
}

function sumEnergyJ(snapshot) {
  const machineEnergy = (snapshot?.machines || []).reduce(
    (sum, machine) => sum + (Number(machine.energyConsumedJ) || 0),
    0,
  );
  const sourceEnergy = (snapshot?.iot || []).reduce(
    (sum, source) =>
      sum + (Number(source.properties?.energyConsumedJ) || 0),
    0,
  );
  return machineEnergy + sourceEnergy;
}

function sumCost(snapshot) {
  return (snapshot?.machines || []).reduce(
    (sum, machine) => sum + (Number(machine.total_cost) || 0),
    0,
  );
}

export function buildSimulationRunMetrics(snapshot) {
  if (!snapshot) return null;
  const taskSummary = buildTaskSummary(
    snapshot.results || [],
    snapshot.totalTasks,
  );
  const results = snapshot.results || [];
  return {
    totalTasks: taskSummary.total,
    completed: taskSummary.completed.length,
    missed: taskSummary.missed.length,
    unassigned: taskSummary.unassigned.length,
    inProgress: taskSummary.inProgress,
    completionRate:
      taskSummary.total > 0
        ? (taskSummary.completed.length / taskSummary.total) * 100
        : 0,
    sourceBatteryFailures: results.filter(
      (task) =>
        task.failure_reason === ENERGY_FAILURE_REASONS.IOT_BATTERY_DEPLETED,
    ).length,
    machineBatteryFailures: results.filter(
      (task) =>
        task.failure_reason === ENERGY_FAILURE_REASONS.MACHINE_BATTERY_DEPLETED,
    ).length,
    totalMachines: (snapshot.machines || []).filter(
      (machine) => machine.id !== -1,
    ).length,
    totalIotDevices: (snapshot.iot || []).filter(
      (source) => source.id !== -3,
    ).length,
    totalEdges: (snapshot.edges || []).length,
    simulationTime: Number(snapshot.time) || 0,
    totalEnergyJ: sumEnergyJ(snapshot),
    totalCost: sumCost(snapshot),
  };
}

function average(values, key) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value[key], 0) / values.length;
}

function sampleStandardDeviation(values, key) {
  if (values.length < 2) return 0;
  const mean = average(values, key);
  const squaredDifferences = values.reduce(
    (sum, value) => sum + (value[key] - mean) ** 2,
    0,
  );
  return Math.sqrt(squaredDifferences / (values.length - 1));
}

export function buildSimulationBatchSummary(entries = []) {
  const completedEntries = entries.filter(
    (entry) => entry.status === "complete" && entry.snapshot,
  );
  const metrics = completedEntries.map((entry) => ({
    runNumber: entry.runNumber,
    seed: entry.seed,
    ...buildSimulationRunMetrics(entry.snapshot),
  }));

  const keys = [
    "totalTasks",
    "completed",
    "missed",
    "unassigned",
    "inProgress",
    "completionRate",
    "sourceBatteryFailures",
    "machineBatteryFailures",
    "totalMachines",
    "totalIotDevices",
    "totalEdges",
    "simulationTime",
    "totalEnergyJ",
    "totalCost",
  ];
  const averages = Object.fromEntries(
    keys.map((key) => [key, average(metrics, key)]),
  );
  const standardDeviations = Object.fromEntries(
    keys.map((key) => [key, sampleStandardDeviation(metrics, key)]),
  );

  return {
    totalRuns: entries.length,
    completedRuns: completedEntries.length,
    failedRuns: entries.filter((entry) => entry.status === "error").length,
    pendingRuns: entries.filter((entry) =>
      ["pending", "running"].includes(entry.status),
    ).length,
    metrics,
    averages,
    standardDeviations,
  };
}
