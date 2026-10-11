import seedrandom from "seedrandom";

export function normalizeRandomSeed(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

export function createRandomGenerator(seed, namespace = "", offset = 0) {
  const normalizedSeed = normalizeRandomSeed(seed);
  if (!normalizedSeed) return Math.random;

  return seedrandom(`${normalizedSeed}:${namespace}:${offset}`);
}
