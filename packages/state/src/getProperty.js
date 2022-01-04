/**
 * Gets a (nested) property of an object.
 *
 * @example
 * const user = {
 *   name: {
 *     first: "Bob",
 *     last: "Dylan"
 *   }
 * };
 *
 * const firstName = getProperty(user, "name.first");
 *
 * console.log(firstName); // "Bob"
 */
export function getProperty(object, key) {
  if (object != null) {
    const parsed = parseKey(key);
    let value = object;

    while (parsed.length > 0) {
      const part = parsed.shift();

      if (part === "*") {
        if (Array.isArray(value)) {
          return value.map((v) => getProperty(v, parsed.join(".")));
        } else {
          value = undefined;
        }
      } else {
        if (value != null) {
          value = value[part];
        } else {
          value = undefined;
        }
      }
    }

    return value;
  }

  return undefined;
}

function parseKey(key) {
  return String(key)
    .split(/[\.\[\]]/)
    .filter((part) => part.trim() !== "");
}
