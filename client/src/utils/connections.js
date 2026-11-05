import { isTopologyReachable } from "./topologyRouting.js";

export function isConnectedToMachine(sourceId, machineId, edges, nodes) {
  return isTopologyReachable(sourceId, machineId, edges, nodes);
}

export function connectedSources(sources, machineId, edges, nodes) {
  if (machineId === undefined || machineId === null) return [];
  return (sources || []).filter(
    (source) =>
      source?.id !== undefined &&
      source?.id !== null &&
      isConnectedToMachine(`nd_${source.id}`, machineId, edges, nodes),
  );
}
