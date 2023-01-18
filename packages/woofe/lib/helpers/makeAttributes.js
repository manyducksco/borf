import produce from "immer";
import OBSERVABLE from "symbol-observable";
import { READABLE, WRITABLE } from "../keys.js";
import { makeState } from "../makeState.js";
import {
  isFunction,
  isObject,
  isObservable,
  isString,
  isNumber,
  isArray,
  isReadable,
  isWritable,
  isBoolean,
} from "./typeChecking.js";
import { deepEqual } from "./deepEqual.js";

export function makeAttributes({ attributes, definitions }) {
  // Separate static attributes, read-only attributes and writable attributes.
  // Set values of static attributes.
  // Create observers for readable and writable attributes.
  // Propagate changes to writable attributes.

  const subscriptions = [];

  const writables = {};
  const readables = {};
  const observables = {};
  const statics = {};

  for (const name in attributes) {
    if (isWritable(attributes[name])) {
      writables[name] = attributes[name];
    } else if (isReadable(attributes[name])) {
      readables[name] = attributes[name];
    } else if (isObservable(attributes[name])) {
      observables[name] = attributes[name];
    } else {
      statics[name] = attributes[name];
    }
  }

  if (definitions) {
    for (const name in definitions) {
      if (!(name in attributes) && definitions[name].default !== undefined) {
        statics[name] = definitions[name].default;
      }
    }
  }

  const initialAttrs = { ...statics };

  for (const name in writables) {
    initialAttrs[name] = writables[name].get();
  }

  for (const name in readables) {
    initialAttrs[name] = readables[name].get();
  }

  const $$attrs = makeState(initialAttrs);

  /**
   * Called by the framework.
   */
  const controls = {
    // Start observing bindings.
    connect() {
      for (const key in readables) {
        subscriptions.push(
          readables[key].subscribe((next) => {
            assertValidItem(definitions, next, key);

            $$attrs.update((current) => {
              current[key] = next;
            });
          })
        );
      }

      for (const key in writables) {
        subscriptions.push(
          writables[key].subscribe((next) => {
            assertValidItem(definitions, next, key);

            $$attrs.update((current) => {
              current[key] = next;
            });
          })
        );
      }

      for (const key in observables) {
        subscriptions.push(
          observables[key].subscribe((next) => {
            assertValidItem(definitions, next, key);

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

      const before = $$attrs.get();
      const after = { ...before, ...values };

      assertValidAttributes(definitions, after);

      const diff = objectDiff(before, after);

      for (const key in diff) {
        if (deepEqual(diff[key].before, diff[key].after)) {
          continue;
        }

        const value = diff[key].after;

        if (writables[key]) {
          // Update writable.
          writables[key].set(value);
        } else if (readables[key]) {
          // Don't change. Throw error.
          throw new Error(`Tried to set value of read-only binding '${key}'. Did you mean to pass a writable binding?`);
        }
      }

      $$attrs.set(after);
    },
    update(fn) {
      if (!isFunction(fn)) {
        throw new TypeError(`Bad call signature. Expected .update(fn). Called as .update(${fn})`);
      }

      const before = $$attrs.get();
      const after = produce(before, fn);

      assertValidAttributes(definitions, after);

      const diff = objectDiff(before, after);

      for (const key in diff) {
        if (deepEqual(diff[key].before, diff[key].after)) {
          continue;
        }

        const value = diff[key].after;

        if (writables[key]) {
          // Update writable.
          writables[key].set(value);
        } else if (readables[key]) {
          // Don't change. Throw error.
          throw new Error(`Tried to set value of read-only binding '${key}'. Did you mean to pass a writable binding?`);
        }
      }

      $$attrs.set(after);
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

function assertValidAttributes(definitions, attributes) {
  if (definitions == null) {
    return; // Pass when no definitions are provided.
  }

  for (const name in definitions) {
    if (definitions[name].required && attributes[name] == null) {
      throw new TypeError(`Attribute '${name}' is required, but value is undefined.`);
    }
  }

  for (const name in attributes) {
    assertValidItem(definitions, attributes[name], name);
  }
}

function assertValidItem(definitions, value, name) {
  if (definitions == null) {
    return; // Pass when no definitions are provided.
  }

  const def = definitions[name];

  if (!def) {
    throw new TypeError(`Attribute '${name}' is not defined, but a value was passed.`);
  }

  if (!def.type) {
    return; // All values are allowed when no type is specified.
  }

  // Type can be a custom validator function taking the item value and returning a boolean.
  if (isFunction(def.type)) {
    if (!def.type(value)) {
      throw new TypeError(`Attribute '${name}' must be a valid type. Got: ${value}`);
    }
  }

  // If not a function, type can be one of these strings.
  switch (def.type) {
    case "boolean":
      if (!isBoolean(value)) {
        throw new TypeError(`Attribute '${name}' must be a boolean. Got: ${value}`);
      }
      break;
    case "string":
      if (!isString(value)) {
        throw new TypeError(`Attribute '${name}' must be a string. Got: ${value}`);
      }
      break;
    case "number":
      if (!isNumber(value)) {
        throw new TypeError(`Attribute '${name}' must be a number. Got: ${value}`);
      }
      break;
    case "array":
      if (!isArray(value)) {
        throw new TypeError(`Attribute '${name}' must be an array. Got: ${value}`);
      }
      break;
    case "object":
      if (!isObject(value)) {
        throw new TypeError(`Attribute '${name}' must be an object. Got: ${value}`);
      }
      break;
    case "function":
      if (!isFunction(value)) {
        throw new TypeError(`Attribute '${name}' must be a function. Got: ${value}`);
      }
      break;
    default:
      throw new TypeError(`Attribute '${name}' is assigned an unrecognized type '${def.type}'.`);
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
