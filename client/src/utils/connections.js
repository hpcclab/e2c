export function isConnectedToMachine(sourceId, machineId, edges, nodes) {
  const source = String(sourceId);
  const target = String(machineId);
  const loadBalancers = new Set(
    (nodes || [])
      .filter((node) => node.type === "LBNode")
      .map((node) => String(node.id)),
  );

  return (edges || []).some((edge) => {
    if (String(edge.source) !== source) return false;
    if (String(edge.target) === target) return true;
    if (!loadBalancers.has(String(edge.target))) return false;
    return edges.some(
      (nextEdge) =>
        String(nextEdge.source) === String(edge.target) &&
        String(nextEdge.target) === target,
    );
  });
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
