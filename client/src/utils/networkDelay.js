// Representative effective/upload data rates in decimal Kbps (kilobits/s).
// They intentionally model relative connection performance rather than every
// possible device, radio mode, signal condition, or protocol overhead.
export const CONNECTIVITY_DATA_RATE_KBPS = Object.freeze({
  Bluetooth: 800,
  LTE: 8800,
  "5G": 22600,
  WiFi: 54000,
  Ethernet: 100000,
  Other: 1000,
  Custom: 1000,
});

export const DEFAULT_CONNECTIVITY = "WiFi";
export const DEFAULT_DATA_RATE_KBPS = CONNECTIVITY_DATA_RATE_KBPS.WiFi;
export const DEFAULT_CUSTOM_DATA_RATE_KBPS = CONNECTIVITY_DATA_RATE_KBPS.Custom;

export function normalizeConnectivity(connectivity) {
  return connectivity === "Custom" ||
    Object.hasOwn(CONNECTIVITY_DATA_RATE_KBPS, connectivity)
    ? connectivity
    : DEFAULT_CONNECTIVITY;
}

export function getDefaultDataRateKbps(connectivity) {
  const normalized = normalizeConnectivity(connectivity);
  return CONNECTIVITY_DATA_RATE_KBPS[normalized];
}

export function getConnectivityDataRateKbps(connectivity, dataRateKbps) {
  const configuredRate = Number(dataRateKbps);
  return Number.isFinite(configuredRate) && configuredRate > 0
    ? configuredRate
    : getDefaultDataRateKbps(connectivity);
}

export function resolveDataRateKbps(properties = {}) {
  const currentRate = Number(properties.dataRateKbps);
  if (Number.isFinite(currentRate) && currentRate > 0) return currentRate;

  // Older Custom workspaces stored KB/s in customThroughputKbps.
  const legacyCustomRate = Number(properties.customThroughputKbps);
  if (
    properties.connectivity === "Custom" &&
    Number.isFinite(legacyCustomRate) &&
    legacyCustomRate > 0
  ) {
    return legacyCustomRate * 8;
  }

  return getDefaultDataRateKbps(properties.connectivity);
}

export function calculateTravelTime(
  dataSizeKb,
  connectivity,
  dataRateKbps,
) {
  const size = Number(dataSizeKb);
  if (!Number.isFinite(size) || size <= 0) return 0;
  const rate = getConnectivityDataRateKbps(connectivity, dataRateKbps);
  return Number(
    ((size * 8) / rate).toFixed(3),
  );
}

export function calculateArrivalTime(
  generationTime,
  dataSizeKb,
  connectivity,
  dataRateKbps,
) {
  const generatedAt = Number(generationTime);
  const safeGenerationTime = Number.isFinite(generatedAt) ? generatedAt : 0;
  return Number(
    (
      safeGenerationTime +
      calculateTravelTime(dataSizeKb, connectivity, dataRateKbps)
    ).toFixed(3),
  );
}
