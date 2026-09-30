export function normalizeDataInput(value) {
  return value && value !== "default" ? value : "binary";
}
