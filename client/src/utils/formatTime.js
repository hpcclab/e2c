/**
 * Formats a utilization_time value (stored in hours) into a human-readable
 * string with the most appropriate unit for edge computing scale.
 *
 * Returns { value: string, unit: string } so callers can render them separately.
 */
export function formatUtilizationTime(hours) {
  if (!hours || hours === 0) return { value: "0", unit: "s" };

  const seconds = hours * 3600;

  if (seconds < 1) {
    return { value: (seconds * 1000).toFixed(1), unit: "ms" };
  }
  if (seconds < 3600) {
    return { value: seconds.toFixed(2), unit: "s" };
  }
  return { value: hours.toFixed(4), unit: "h" };
}

/**
 * Formats an energy value (stored in kWh) into a human-readable string
 * with the most appropriate unit for edge computing scale.
 * For ms-duration tasks, joules/millijoules are far more readable than kWh.
 *
 * Returns { value: string, unit: string }.
 */
export function formatEnergy(kWh) {
  if (!kWh || kWh === 0) return { value: "0", unit: "mJ" };

  const joules = kWh * 3_600_000;

  if (joules < 0.001) {
    return { value: (joules * 1_000_000).toFixed(2), unit: "μJ" };
  }
  if (joules < 1) {
    return { value: (joules * 1000).toFixed(2), unit: "mJ" };
  }
  if (joules < 3600) {
    return { value: joules.toFixed(2), unit: "J" };
  }
  if (joules < 3_600_000) {
    return { value: (kWh * 1000).toFixed(3), unit: "Wh" };
  }
  return { value: kWh.toFixed(4), unit: "kWh" };
}
