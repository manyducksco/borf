import { isArray, isObject } from "./typeChecking";

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
 * const firstName = getProperty(user, "name.first"); // firstName === "Bob"
 */
export function getProperty(object, key) {
  if (object != null) {
    const parsed = parseKey(key);
    let value = object;

    while (parsed.length > 0) {
      const part = parsed.shift();

      if (value != null) {
        value = value[part];
      } else {
        value = undefined;
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
