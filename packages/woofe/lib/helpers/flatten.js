/**
 * Recursively flattens a nested array to one level.
 */
export function flatten(arr) {
  const flattened = [];

  for (const item of arr) {
    if (Array.isArray(item)) {
      flattened.push(...flatten(item));
    } else {
      flattened.push(item);
    }
  }

  return flattened;
}
