export function isState(value) {
  return value != null && typeof value === "object" && value.isState;
}
