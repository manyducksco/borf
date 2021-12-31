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
 *
 * "friends[3].name.last" // also use array notation for getting array items at an index?
 * "[2].name" // when object is an array, this would get the property "name" of the item at index 2
 * // pass just a number to get an array index?
 */
export function getProperty(object, key) {
  if (object != null) {
    const parsed = parseKey(key);
    let value = object;

    while (parsed.length > 0) {
      part = parsed.shift();

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
