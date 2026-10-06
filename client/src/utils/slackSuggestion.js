import { isConnectedToMachine } from "./connections.js";
import {
  getMachineEetMean,
  getMachineEetStdDev,
} from "./executionTime.js";
import { getSourceEdgeNetwork } from "./edgeNetwork.js";

// A one-sided 95th percentile gives the task a 95% chance of fitting within
// the suggested slack when data size and EET follow their configured normals.
export const SUGGESTED_SLACK_Z_SCORE = 1.645;

function nonNegativeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
}

function roundUpHundredth(value) {
  return Math.ceil((value - Number.EPSILON) * 100) / 100;
}

export function calculateSuggestedSlack({
  source,
  machines = [],
  edges = [],
  nodes = [],
}) {
  if (!source?.properties || source.id === undefined || source.id === null) {
    return null;
  }

  const sourceNodeId = String(source.id).startsWith("nd_")
    ? String(source.id)
    : `nd_${source.id}`;
  const connectedMachines = machines.filter((machine) =>
    isConnectedToMachine(sourceNodeId, machine.id, edges, nodes),
  );
  if (connectedMachines.length === 0) return null;

  const properties = source.properties;
  const taskType = properties.task_type ?? source.name ?? "";
  const dataSizeMean = nonNegativeNumber(properties.meanSize);
  const dataSizeStdDev = nonNegativeNumber(
    properties.dataSizeStdDev ?? properties.stdv,
  );
  const conservativeDataSize =
    dataSizeMean + SUGGESTED_SLACK_Z_SCORE * dataSizeStdDev;
  const { dataRateKbps } = getSourceEdgeNetwork(source.id, edges, properties);
  const transferTime = (conservativeDataSize * 8) / dataRateKbps;

  const executionTimes = connectedMachines.map((machine) =>
    getMachineEetMean(machine, source.id, taskType) +
    SUGGESTED_SLACK_Z_SCORE *
      getMachineEetStdDev(machine, source.id, taskType),
  );
  const executionTime = Math.max(...executionTimes);
  const exactSlack = transferTime + executionTime;

  return {
    slack: roundUpHundredth(exactSlack),
    transferTime,
    executionTime,
    connectedMachineCount: connectedMachines.length,
  };
}
