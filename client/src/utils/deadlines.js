export function nonNegativeSlack(value) {
  const slack = Number(value);
  return Number.isFinite(slack) ? Math.max(0, slack) : 0;
}

export function deadlineFromArrival(arrivalTime, slack) {
  return Number(arrivalTime) + nonNegativeSlack(slack);
}
