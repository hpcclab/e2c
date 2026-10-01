export const TASK_COLOR_NAMES = [
  "Slate",
  "Sky",
  "Teal",
  "Emerald",
  "Violet",
  "Rose",
  "Amber",
  "Fuchsia",
];

export const sourceTaskColorKey = (sourceId) => `source:${sourceId}`;

export function getNextTaskColor(currentColor, sources = []) {
  const currentIndex = TASK_COLOR_NAMES.indexOf(currentColor);
  const startIndex = currentIndex >= 0 ? currentIndex : 0;
  const usedColors = new Set(
    sources.map((source) => source?.properties?.taskColor).filter(Boolean),
  );

  for (let offset = 1; offset < TASK_COLOR_NAMES.length; offset += 1) {
    const candidate =
      TASK_COLOR_NAMES[(startIndex + offset) % TASK_COLOR_NAMES.length];
    if (!usedColors.has(candidate)) return candidate;
  }

  // If every palette color is already in use, still make the copy visibly
  // different from its source by cycling to the next color.
  return TASK_COLOR_NAMES[(startIndex + 1) % TASK_COLOR_NAMES.length];
}
