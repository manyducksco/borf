export function parseCombo(combo: string) {
  return combo
    .toLowerCase()
    .split("+")
    .map((part) => part.trim())
    .sort();
}
