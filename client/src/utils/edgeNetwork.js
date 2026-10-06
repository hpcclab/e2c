import {
  DEFAULT_CONNECTIVITY,
  getConnectivityDataRateKbps,
  normalizeConnectivity,
  resolveDataRateKbps,
} from "./networkDelay.js";

export const EDGE_NETWORK_TYPES = [
  "Ethernet",
  "WiFi",
  "5G",
  "LTE",
  "Bluetooth",
  "Custom",
];

export const EDGE_NETWORK_VISUALS = Object.freeze({
  Ethernet: { color: "#2563eb", dash: undefined, label: "Wired" },
  WiFi: { color: "#0ea5e9", dash: "12 7", label: "Wireless" },
  "5G": { color: "#7c3aed", dash: "16 5 3 5", label: "Cellular" },
  LTE: { color: "#ea580c", dash: "10 6", label: "Cellular" },
  Bluetooth: { color: "#0f766e", dash: "2 6", label: "Short range" },
  Custom: { color: "#64748b", dash: "7 5", label: "Custom" },
});

export function createEdgeNetworkProperties(sourceProperties = {}) {
  const networkType = normalizeConnectivity(
    sourceProperties.networkType ?? sourceProperties.connectivity,
  );
  return {
    networkType,
    dataRateKbps: resolveDataRateKbps({
      ...sourceProperties,
      connectivity: networkType,
    }),
  };
}

export function resolveEdgeNetwork(edge, fallbackProperties = {}) {
  const properties = edge?.data?.properties ?? edge?.properties ?? {};
  const explicitType = properties.networkType ?? properties.connectivity;
  const fallback = createEdgeNetworkProperties(fallbackProperties);
  const networkType = explicitType
    ? normalizeConnectivity(explicitType)
    : fallback.networkType;
  const dataRateKbps = getConnectivityDataRateKbps(
    networkType,
    properties.dataRateKbps ?? (explicitType ? undefined : fallback.dataRateKbps),
  );

  return { networkType, dataRateKbps };
}

export function getSourceEdgeNetwork(
  sourceId,
  edges = [],
  fallbackProperties = {},
) {
  const normalizedSourceId = String(sourceId).startsWith("nd_")
    ? String(sourceId)
    : `nd_${sourceId}`;
  const outgoingEdges = edges.filter(
    (edge) => String(edge.source) === normalizedSourceId,
  );

  if (outgoingEdges.length === 0) {
    return createEdgeNetworkProperties(fallbackProperties);
  }

  // A task's destination is chosen later by the scheduler. When one source has
  // several possible outgoing links, use the slowest link so its arrival time
  // and suggested slack remain safe for every reachable destination.
  return outgoingEdges
    .map((edge) => resolveEdgeNetwork(edge, fallbackProperties))
    .reduce((slowest, network) =>
      network.dataRateKbps < slowest.dataRateKbps ? network : slowest,
    );
}

export function getEdgeNetworkVisual(networkType) {
  return (
    EDGE_NETWORK_VISUALS[normalizeConnectivity(networkType)] ??
    EDGE_NETWORK_VISUALS[DEFAULT_CONNECTIVITY]
  );
}

export function formatDataRate(dataRateKbps) {
  const rate = Number(dataRateKbps);
  if (!Number.isFinite(rate)) return "—";
  if (rate >= 1000) {
    return `${Number((rate / 1000).toFixed(rate >= 10000 ? 0 : 1))} Mbps`;
  }
  return `${Number(rate.toFixed(1))} Kbps`;
}
