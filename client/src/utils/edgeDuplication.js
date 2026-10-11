import { resolveEdgeNetwork } from "./edgeNetwork.js";

const sourcePropertiesForEdge = (edge, sources = []) => {
  const sourceId = String(edge?.source ?? "").replace(/^nd_/, "");
  return sources.find((source) => String(source?.id) === sourceId)?.properties;
};

export function duplicateEdgeProperties(sourceEdge, targetEdge, sources = []) {
  if (!sourceEdge || !targetEdge) return targetEdge;

  const resolvedNetwork = resolveEdgeNetwork(
    sourceEdge,
    sourcePropertiesForEdge(sourceEdge, sources),
  );
  const properties = {
    ...(sourceEdge.data?.properties ?? sourceEdge.properties ?? {}),
    networkType: resolvedNetwork.networkType,
    dataRateKbps: resolvedNetwork.dataRateKbps,
  };

  return {
    ...targetEdge,
    data: {
      ...targetEdge.data,
      properties: { ...properties },
    },
  };
}
