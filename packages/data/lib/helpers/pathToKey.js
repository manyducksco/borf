/**
 * Convert an object path as an array into a string.
 */
export function pathToKey(path) {
  let key = "";

  for (const entry of path) {
    if (typeof entry === "number") {
      key += `[${entry}]`;
    } else if (key.length === 0) {
      key += entry;
    } else {
      key += "." + entry;
    }
  }

  return key;
}
