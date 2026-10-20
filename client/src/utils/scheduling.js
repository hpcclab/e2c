export const SCHEDULING_MODES = Object.freeze({
  IMMEDIATE: "immediate",
  PERIODIC_BATCH: "batch",
});

export const DEFAULT_BATCH_INTERVAL_SECONDS = 5;
export const MIN_BATCH_INTERVAL_SECONDS = 0.01;
export const MAX_BATCH_INTERVAL_SECONDS = 3600;
export const DEFAULT_MACHINE_QUEUE_LIMIT = 2;

export const IMMEDIATE_POLICY_OPTIONS = Object.freeze([
  { alias: "FCFS", name: "First Come, First Serve" },
  { alias: "MECT", name: "Minimum Expected Completion Time" },
  { alias: "MEET", name: "Minimum Expected Execution Time" },
  { alias: "RAND", name: "Random" },
  { alias: "URI", name: "Uniform Resender Identifier" },
  { alias: "LC", name: "Least Connection" },
]);

export const BATCH_POLICY_OPTIONS = Object.freeze([
  { alias: "MM", name: "MinCompletion–MinCompletion" },
  { alias: "MMU", name: "MinCompletion–MaxUrgency" },
  { alias: "MSD", name: "MinCompletion–SoonestDeadline" },
]);

export const SCHEDULING_FAILURE_REASONS = Object.freeze({
  DEADLINE_EXPIRED_WAITING_FOR_BATCH:
    "DEADLINE_EXPIRED_WAITING_FOR_BATCH",
  DEADLINE_EXPIRED_BEFORE_ASSIGNMENT:
    "DEADLINE_EXPIRED_BEFORE_ASSIGNMENT",
});

export const normalizeSchedulingMode = (value) =>
  value === SCHEDULING_MODES.PERIODIC_BATCH
    ? SCHEDULING_MODES.PERIODIC_BATCH
    : SCHEDULING_MODES.IMMEDIATE;

export const getSchedulingPolicyOptions = (mode) =>
  normalizeSchedulingMode(mode) === SCHEDULING_MODES.PERIODIC_BATCH
    ? BATCH_POLICY_OPTIONS
    : IMMEDIATE_POLICY_OPTIONS;

export const normalizeSchedulingPolicyAlias = (alias, mode) => {
  const options = getSchedulingPolicyOptions(mode);
  return options.some((option) => option.alias === alias)
    ? alias
    : options[0].alias;
};

export const normalizeBatchIntervalSeconds = (
  value,
  fallback = DEFAULT_BATCH_INTERVAL_SECONDS,
) => {
  const parsed = Number(value);
  const fallbackNumber = Number(fallback);
  const safeFallback = Number.isFinite(fallbackNumber)
    ? fallbackNumber
    : DEFAULT_BATCH_INTERVAL_SECONDS;
  const interval = Number.isFinite(parsed) ? parsed : safeFallback;
  const bounded = Math.min(
    MAX_BATCH_INTERVAL_SECONDS,
    Math.max(MIN_BATCH_INTERVAL_SECONDS, interval),
  );
  // The engine advances in hundredths of a second. Round upward so the batch
  // never fires earlier than the period the user requested.
  return Math.ceil((bounded - Number.EPSILON) * 100) / 100;
};

export const schedulingModeLabel = (mode) =>
  normalizeSchedulingMode(mode) === SCHEDULING_MODES.PERIODIC_BATCH
    ? "Periodic batch"
    : "Immediate";
