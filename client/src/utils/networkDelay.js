// Representative effective/upload throughput values in decimal KB/s.
// They intentionally model relative connection performance rather than every
// possible device, radio mode, signal condition, or protocol overhead.
export const CONNECTIVITY_THROUGHPUT_KBPS = Object.freeze({
  Bluetooth: 100, // Bluetooth LE 1M: about 800 kb/s application throughput
  LTE: 1100, // 8.8 Mb/s mean US LTE upload throughput
  "5G": 2825, // 22.6 Mb/s mean US 5G upload throughput
  WiFi: 6750, // 54 Mb/s representative Wi-Fi link
  Ethernet: 12500, // 100 Mb/s Ethernet
  Other: 125, // Conservative 1 Mb/s fallback
});

export const DEFAULT_CONNECTIVITY = "WiFi";
export const DEFAULT_CUSTOM_THROUGHPUT_KBPS = 125;

export function normalizeConnectivity(connectivity) {
  return connectivity === "Custom" ||
    Object.hasOwn(CONNECTIVITY_THROUGHPUT_KBPS, connectivity)
    ? connectivity
    : DEFAULT_CONNECTIVITY;
}

export function getConnectivityThroughput(connectivity, customThroughputKbps) {
  const normalized = normalizeConnectivity(connectivity);
  if (normalized === "Custom") {
    const customRate = Number(customThroughputKbps);
    return Number.isFinite(customRate) && customRate > 0
      ? customRate
      : DEFAULT_CUSTOM_THROUGHPUT_KBPS;
  }
  return CONNECTIVITY_THROUGHPUT_KBPS[normalized];
}

export function calculateTravelTime(
  dataSizeKb,
  connectivity,
  customThroughputKbps,
) {
  const size = Number(dataSizeKb);
  if (!Number.isFinite(size) || size <= 0) return 0;
  return Number(
    (
      size / getConnectivityThroughput(connectivity, customThroughputKbps)
    ).toFixed(3),
  );
}

export function calculateArrivalTime(
  generationTime,
  dataSizeKb,
  connectivity,
  customThroughputKbps,
) {
  const generatedAt = Number(generationTime);
  const safeGenerationTime = Number.isFinite(generatedAt) ? generatedAt : 0;
  return Number(
    (
      safeGenerationTime +
      calculateTravelTime(dataSizeKb, connectivity, customThroughputKbps)
    ).toFixed(3),
  );
}
