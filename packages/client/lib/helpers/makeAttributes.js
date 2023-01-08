import produce from "immer";
import OBSERVABLE from "symbol-observable";
import { READABLE, WRITABLE } from "../keys.js";
import { makeState } from "./state.js";
import {
  isFunction,
  isObject,
  isObservable,
  isString,
  isNumber,
  isArray,
  isWritable,
  isBoolean,
} from "./typeChecking.js";
import { deepEqual } from "./deepEqual.js";

export function makeAttributes(channel, attributes, traits) {
  // Separate static attributes, read-only attributes and writable attributes.
  // Set values of static attributes.
  // Create observers for readable and writable attributes.
  // Propagate changes to writable attributes.

  const subscriptions = [];

  const writables = {};
  const readables = {};
  const statics = {};

  for (const key in attributes) {
    if (isWritable(attributes[key])) {
      writables[key] = attributes[key];
    } else if (isObservable(attributes[key])) {
      readables[key] = attributes[key];
    } else {
      statics[key] = attributes[key];
    }
  }

  const $$attrs = makeState({ ...statics });

  /**
   * Called by the framework.
   */
  const controls = {
    // Start observing bindings.
    connect() {
      for (const key in readables) {
        subscriptions.push(
          readables[key].subscribe((next) => {
            assertValidAttribute(traits, { [key]: next }, key);

            $$attrs.update((current) => {
              current[key] = next;
            });
          })
        );
      }

      for (const key in writables) {
        subscriptions.push(
          writables[key].subscribe((next) => {
            assertValidAttribute(traits, { [key]: next }, key);

            $$attrs.update((current) => {
              current[key] = next;
            });
          })
        );
      }
    },
    // Stop observing bindings.
    disconnect() {
      while (subscriptions.length > 0) {
        const sub = subscriptions.shift();
        sub.unsubscribe();
      }
    },
  };

  /**
   * Called by the user's code.
   */
  const api = {
    get(...args) {
      if (args.length === 0) {
        return $$attrs.get();
      }

      if (args.length === 1 && isString(args[0])) {
        return $$attrs.get()[args[0]];
      }

      throw new TypeError(`Bad call signature. Expected .get() or .get("key"). Called as .get(${args.join(", ")})`);
    },
    set(...args) {
      let values;

      if (args.length === 1 && isObject(args[0])) {
        values = args[0];
      }

      if (args.length === 2 && isString(args[0])) {
        values = {
          [args[0]]: args[1],
        };
      }

      if (!isObject(values)) {
        throw new TypeError(
          `Bad call signature. Expected .set({ key: value }) or .set("key", value). Called as .set(${args.join(", ")})`
        );
      }

      // Assert that new values match types defined by traits.
      // TODO: Disable with app setting (and by default in production builds).
      for (const key in values) {
        assertValidAttribute(traits, values, key);
      }

      $$attrs.update((current) => {
        for (const key in values) {
          if (writables[key]) {
            // Change and update writable.
            current[key] = values[key];
            writables[key].set(values[key]);
          } else if (readables[key]) {
            // Don't change. Print warning.
            channel.warn(`Tried to set value of read-only binding '${key}'. Did you mean to use a writable binding?`);
          } else {
            // Update value.
            current[key] = values[key];
          }
        }
      });
    },
    update(fn) {
      if (!isFunction(fn)) {
        throw new TypeError(`Bad call signature. Expected .update(fn). Called as .update(${fn})`);
      }

      const before = $$attrs.get();
      const after = produce(before, fn);

      // Validate that attributes match the types defined by traits.
      for (const key in after) {
        assertValidAttribute(traits, after, key);
      }

      const diff = objectDiff(before, after);

      $$attrs.update((current) => {
        for (const key in diff) {
          if (deepEqual(diff[key].before, diff[key].after)) {
            continue;
          }

          const value = diff[key].after;

          if (writables[key]) {
            // Change and update writable.
            current[key] = value;
            writables[key].set(value);
          } else if (readables[key]) {
            // Don't change. Print warning.
            channel.warn(`Tried to set value of read-only binding '${key}'. Did you mean to use a writable binding?`);
          } else {
            // Update value.
            current[key] = value;
          }
        }
      });
    },
    readable(...args) {
      if (args.length === 0) {
        return $$attrs.readable();
      }

      if (isString(args[0])) {
        return $$attrs.as((current) => current[args[0]]);
      }

      throw new TypeError(
        `Bad call signature. Expected .readable() or .readable("key"). Called as .readable(${args.join(", ")})`
      );
    },
    writable(key) {
      if (key == null) {
        return $$attrs;
      }

      const binding = {
        get() {
          return $$attrs.get()[key];
        },
        set(value) {
          assertValidAttribute(traits, { [key]: value }, key);

          // TODO: Validate and parse.
          return api.update((current) => {
            current[key] = value;
          });
        },
        update(fn) {
          // TODO: Validate and parse.
          return api.update((current) => {
            const returned = fn(current[key]);
            if (returned) {
              current[key] = returned;
            }
          });
        },
        readable() {
          return $$attrs.as((current) => current[key]);
        },
        as(fn) {
          return $$attrs.as((current) => fn(current[key]));
        },
        subscribe(...args) {
          return $$attrs.as((current) => current[key]).subscribe(...args);
        },
      };

      Object.defineProperties(binding, {
        [OBSERVABLE]: {
          value: () => binding,
        },
        [READABLE]: {
          value: () => binding,
        },
        [WRITABLE]: {
          value: () => binding,
        },
      });

      return binding;
    },
    as(transform) {
      return $$attrs.as(transform);
    },
    subscribe(...args) {
      return $$attrs.subscribe(...args);
    },
  };

  Object.defineProperties(api, {
    [OBSERVABLE]: {
      value: () => api,
    },
    [READABLE]: {
      value: () => api,
    },
    [WRITABLE]: {
      value: () => api,
    },
  });

  return { controls, api };
}

function assertValidAttribute(traits, attributes, key) {
  if (traits.length === 0) {
    return;
  }

  const trait = trait.find((t) => t._trait === "attribute" && t.name === key);

  if (!trait) {
    throw new TypeError(`Attribute '${key}' is not defined on this view.`);
  }

  if (!trait.options.type) {
    return; // All values are allowed when no type is specified.
  }

  switch (trait.type) {
    case "boolean":
      if (!isBoolean(attributes[key])) {
        throw new TypeError(`Attribute '${key}' must be a boolean. Got: ${attributes[key]}`);
      }
      break;
    case "string":
      if (!isString(attributes[key])) {
        throw new TypeError(`Attribute '${key}' must be a string. Got: ${attributes[key]}`);
      }
      break;
    case "number":
      if (!isNumber(attributes[key])) {
        throw new TypeError(`Attribute '${key}' must be a number. Got: ${attributes[key]}`);
      }
      break;
    case "array":
      if (!isArray(attributes[key])) {
        throw new TypeError(`Attribute '${key}' must be an array. Got: ${attributes[key]}`);
      }
      break;
    case "object":
      if (!isObject(attributes[key])) {
        throw new TypeError(`Attribute '${key}' must be an object. Got: ${attributes[key]}`);
      }
      break;
    case "function":
      if (!isFunction(attributes[key])) {
        throw new TypeError(`Attribute '${key}' must be a function. Got: ${attributes[key]}`);
      }
      break;
    default:
      throw new TypeError(`Attribute '${key}' does not support type '${trait.type}'.`);
  }
}

/**
 * Creates an object that describes the changes between an older and newer version of an object.
 */
function objectDiff(before, after) {
  const values = {};

  for (const key in before) {
    if (!values[key]) {
      values[key] = { before: undefined, after: undefined };
    }

    values[key].before = before[key];
  }

  for (const key in after) {
    if (!values[key]) {
      values[key] = { before: undefined, after: undefined };
    }

    values[key].after = after[key];
  }

  return values;
}
