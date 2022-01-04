export function isState(value) {
  return typeof value === "object" && value.isState;
}
