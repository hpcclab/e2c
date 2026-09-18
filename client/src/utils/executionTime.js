export const DEFAULT_EET_MEAN = 1;
export const DEFAULT_EET_STD_DEV = 0.25;

export function sourceEetKey(sourceId) {
  return `source:${sourceId}`;
}

export function getEetMean(value) {
  const mean = Number(value);
  return Number.isFinite(mean) && mean > 0 ? mean : DEFAULT_EET_MEAN;
}

export function getEetStdDev(value) {
  if (value === undefined || value === null || value === "") {
    return DEFAULT_EET_STD_DEV;
  }
  const stdDev = Number(value);
  return Number.isFinite(stdDev) ? Math.max(0, stdDev) : DEFAULT_EET_STD_DEV;
}

export function getMachineEetMean(machine, sourceId, taskType) {
  const sourceValue = sourceId === undefined || sourceId === null
    ? undefined
    : machine.eet?.[sourceEetKey(sourceId)];
  return getEetMean(sourceValue ?? machine.eet?.[taskType]);
}

export function getMachineEetStdDev(machine, sourceId, taskType) {
  const sourceValue = sourceId === undefined || sourceId === null
    ? undefined
    : machine.eetStdDev?.[sourceEetKey(sourceId)];
  return getEetStdDev(sourceValue ?? machine.eetStdDev?.[taskType]);
}

// Draw once per task. Non-positive normal draws are retried because a task
// cannot have a negative execution duration.
export function sampleExecutionTime(meanValue, stdDevValue, random = Math.random) {
  const mean = getEetMean(meanValue);
  const stdDev = getEetStdDev(stdDevValue);
  if (stdDev === 0) return mean;

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const u1 = Math.max(Number.MIN_VALUE, 1 - random());
    const u2 = random();
    const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const duration = mean + stdDev * normal;
    if (Number.isFinite(duration) && duration > 0) return duration;
  }

  return mean;
}
