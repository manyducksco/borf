import { isFunction, isArray } from "./typeChecking.js";

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
 * const lastName = getProperty(user, (u) => u.name.last);
 *
 * console.log(firstName); // "Bob"
 */
export function getProperty(object, selector) {
  if (selector == null) {
    return object;
  }

  if (isFunction(selector)) {
    try {
      return selector(object);
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("of undefined")) {
        // Function tried to access properties on an undefined object.
        return undefined;
      } else {
        // Rethrow any other error.
        throw err;
      }
    }
  }

  if (object != null) {
    const parsed = parseKey(selector);
    let value = object;

    while (parsed.length > 0) {
      const part = parsed.shift();

      if (part === "*") {
        if (isArray(value)) {
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
