const MISSED_STATUSES = new Set(["MISSED", "DEADLINE_MISSED", "DNR"]);

const normalizedStatus = (task) => String(task?.status || "").toUpperCase();

export function buildTaskSummary(dataResults = [], configuredTotal = 0) {
  const results = Array.isArray(dataResults) ? dataResults : [];
  const completed = results.filter(
    (task) => normalizedStatus(task) === "COMPLETED",
  );
  const missed = results.filter((task) =>
    MISSED_STATUSES.has(normalizedStatus(task)),
  );
  const cancelled = results.filter(
    (task) => normalizedStatus(task) === "CANCELLED",
  );
  const unassigned = results.filter(
    (task) => normalizedStatus(task) === "NEW",
  );
  const parsedTotal = Number(configuredTotal);
  const total = Number.isFinite(parsedTotal) && parsedTotal >= 0
    ? Math.max(parsedTotal, results.length)
    : results.length;
  const accountedFor =
    completed.length + missed.length + cancelled.length + unassigned.length;

  return {
    total,
    completed,
    missed,
    cancelled,
    unassigned,
    inProgress: Math.max(0, total - accountedFor),
    completionPercentage:
      total > 0 ? ((completed.length / total) * 100).toFixed(2) : "0.00",
  };
}
