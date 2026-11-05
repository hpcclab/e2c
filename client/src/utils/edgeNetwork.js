import {
  DEFAULT_CONNECTIVITY,
  getConnectivityDataRateKbps,
  normalizeConnectivity,
  resolveDataRateKbps,
} from "./networkDelay.js";
import { getEffectiveSourceEdges } from "./topologyRouting.js";

export const EDGE_NETWORK_TYPES = [
  "Ethernet",
  "WiFi",
  "5G",
  "LTE",
  "Bluetooth",
  "Custom",
];

// Reference-device transmit/traffic power defaults. These are reproducible
// examples from official manufacturer datasheets, not universal values for an
// entire network standard. Every connection remains user-editable.
export const EDGE_DEFAULT_UPLOAD_POWER_W = Object.freeze({
  Ethernet: 0.148,
  WiFi: 0.9603,
  "5G": 1.6758,
  LTE: 0.8672,
  Bluetooth: 0.0144,
  Custom: 1,
});

export const EDGE_UPLOAD_POWER_REFERENCES = Object.freeze({
  Ethernet: Object.freeze({
    device: "Microchip LAN8720A",
    condition: "Typical device power with 100BASE-TX traffic",
    calculation: "148 mW = 0.148 W",
    source:
      "https://ww1.microchip.com/downloads/en/DeviceDoc/00002165B.pdf",
  }),
  WiFi: Object.freeze({
    device: "Espressif ESP32-S3",
    condition: "802.11g transmission at 54 Mbps and 19 dBm",
    calculation: "3.3 V × 291 mA = 0.9603 W",
    source: "https://documentation.espressif.com/esp32-s3_datasheet_en.pdf",
  }),
  "5G": Object.freeze({
    device: "Quectel RG500Q-EA/RG502Q-EA",
    condition: "5G NR SA TDD n78 data transfer at 23.2 dBm",
    calculation: "3.8 V × 441 mA = 1.6758 W",
    source:
      "https://quectel.com/content/uploads/2024/02/Quectel_RG50xQ_Series_Hardware_Design_V1.1-2.pdf",
  }),
  LTE: Object.freeze({
    device: "Quectel BG96",
    condition: "LTE Cat M1 B3 data transfer at approximately 23 dBm",
    calculation: "3.8 V × 228.21 mA = 0.8672 W",
    source:
      "https://quectel.com/content/uploads/2024/02/Quectel_BG96_Hardware_Design_V1.6-4.pdf",
  }),
  Bluetooth: Object.freeze({
    device: "Nordic nRF52840",
    condition: "Bluetooth LE transmission at 0 dBm",
    calculation: "3.0 V × 4.8 mA = 0.0144 W",
    source:
      "https://docs.nordicsemi.com/r/bundle/ps_nrf52840/page/radio.html",
  }),
});

export function getDefaultUploadPowerW(networkType) {
  return EDGE_DEFAULT_UPLOAD_POWER_W[normalizeConnectivity(networkType)] ?? 1;
}

export function getUploadPowerReference(networkType) {
  return EDGE_UPLOAD_POWER_REFERENCES[normalizeConnectivity(networkType)] ?? null;
}

function resolveUploadPowerW(value, networkType) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0
    ? parsed
    : getDefaultUploadPowerW(networkType);
}

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
    uploadPowerW: resolveUploadPowerW(
      sourceProperties.uploadPowerW,
      networkType,
    ),
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
  const uploadPowerW = resolveUploadPowerW(
    properties.uploadPowerW ?? (explicitType ? undefined : fallback.uploadPowerW),
    networkType,
  );

  return { networkType, dataRateKbps, uploadPowerW };
}

export function getSourceEdgeNetwork(
  sourceId,
  edges = [],
  fallbackProperties = {},
  nodes = [],
) {
  const normalizedSourceId = String(sourceId).startsWith("nd_")
    ? String(sourceId)
    : `nd_${sourceId}`;
  const outgoingEdges = getEffectiveSourceEdges(
    normalizedSourceId,
    edges,
    nodes,
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
