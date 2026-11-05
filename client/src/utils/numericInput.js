// Normalize only the unfocused display, never the text under the cursor.
export const numberInputDisplay = (value) => {
  if (value === "" || value == null) return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : "";
};

export const nonNegativeNumberDraft = (value) => {
  if (value === "") return "";

  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : "";
};

export const nonNegativeNumberValue = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
};
