/**
 * Recursively `Object.freeze` all nested objects.
 */
export function deepFreeze(object) {
  for (const key in object) {
    const value = object[key];

    if (typeof value === "object" && value != null) {
      deepFreeze(value);
    }
  }

  return Object.freeze(object);
}
