export const TASK_COLOR_PALETTE = [
  { name: "Slate", bg: "#334155", text: "#e2e8f0", accent: "#94a3b8" },
  { name: "Sky", bg: "#0369a1", text: "#e0f2fe", accent: "#7dd3fc" },
  { name: "Teal", bg: "#0f766e", text: "#ccfbf1", accent: "#5eead4" },
  { name: "Emerald", bg: "#166534", text: "#dcfce7", accent: "#86efac" },
  { name: "Violet", bg: "#5b21b6", text: "#ede9fe", accent: "#c4b5fd" },
  { name: "Rose", bg: "#9f1239", text: "#ffe4e6", accent: "#fda4af" },
  { name: "Amber", bg: "#92400e", text: "#fef3c7", accent: "#fcd34d" },
  { name: "Fuchsia", bg: "#86198f", text: "#fae8ff", accent: "#e879f9" },
];

export const TASK_COLOR_NAMES = TASK_COLOR_PALETTE.map(({ name }) => name);

export function getTaskColor(colorName = "Slate") {
  return (
    TASK_COLOR_PALETTE.find(({ name }) => name === colorName) ??
    TASK_COLOR_PALETTE[0]
  );
}

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
