/**
 * Attempts to convert a `source` value to the same type as a `target` value.
 */
export function toSameType(target: any, source: any) {
  const type = typeof target;

  if (type === "string") {
    return String(source);
  }

  if (type === "number") {
    return Number(source);
  }

  if (type === "boolean") {
    return Boolean(source);
  }

  return source;
}
