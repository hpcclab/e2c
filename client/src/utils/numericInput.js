export const nonNegativeNumberDraft = (value) => {
  if (value === "") return "";

  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : "";
};

export const nonNegativeNumberValue = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
};
