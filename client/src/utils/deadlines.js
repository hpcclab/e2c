export function nonNegativeSlack(value) {
  const slack = Number(value);
  return Number.isFinite(slack) ? Math.max(0, slack) : 0;
}

export function deadlineFromGeneration(generationTime, slack) {
  const generatedAt = Number(generationTime);
  return (Number.isFinite(generatedAt) ? generatedAt : 0) + nonNegativeSlack(slack);
}

// Kept for compatibility with older imports. New workload generation uses the
// generation-time helper above because transmission time consumes task slack.
export function deadlineFromArrival(arrivalTime, slack) {
  return deadlineFromGeneration(arrivalTime, slack);
}
