import produce from "immer";
import { isFunction } from "../../_helpers/typeChecking.js";
import { deepEqual } from "../../_helpers/deepEqual.js";

const methodBlacklist = ["get", "set", "watch", "map", "toString"];

/**
 * Creates a state container in the form of a function.
 *
 * @param initialValue - Starting value (optional)
 * @param options - Configure this state (supports `immutable` bool and `methods` object)
 */
export function createState(initialValue, options) {
  options = options || {};

  let current = initialValue;
  let watchers = [];
  let methods = {};

  if (options.methods) {
    for (const name in options.methods) {
      if (methodBlacklist.includes(name)) {
        throw new Error(
          `Can't use method name '${name}' because it conflicts with a built-in state method.`
        );
      }

      const method = options.methods[name];

      methods[name] = function (...args) {
        const newValue = produce(current, (draft) => {
          return method(draft, ...args);
        });

        if (isFunction(newValue)) {
          throw new TypeError(
            `State method '${name}' returned a function. Expected a value.`
          );
        }

        current = newValue;
      };
    }
  }

  return {
    ...methods,

    get isState() {
      return true;
    },

    get() {
      return current;
    },

    set(value) {
      if (options.settable === false) {
        throw new Error("This state is not settable.");
      }

      // handle `.set((current) => updated)` transform function
      if (value instanceof Function) {
        value = value(current);
      }

      if (!deepEqual(current, value)) {
        current = value;

        for (const callback of watchers) {
          callback(current);
        }
      }
    },

    watch(callback) {
      if (!isFunction(callback)) {
        throw new TypeError(
          `Expected a watcher function. Received: ${callback}`
        );
      }

      watchers.push(callback);

      return function cancel() {
        watchers.splice(watchers.indexOf(callback), 1);
      };
    },

    map(transform) {
      return mapState(this, transform);
    },

    toString() {
      return String(current);
    },
  };
}

/**
 * Creates a state whose value is a result of running a source state's value through a transform function.
 *
 * @param source - A source state
 * @param transform - Function that takes source's value and returns a new value.
 */
export function mapState(source, transform) {
  return {
    get isState() {
      return true;
    },

    get() {
      return transform(source.get());
    },

    watch(callback) {
      if (!isFunction(callback)) {
        throw new TypeError(
          `Expected a watcher function. Received: ${callback}`
        );
      }

      return source.watch((value) => {
        callback(transform(value));
      });
    },

    map(transform) {
      return mapState(this, transform);
    },

    toString() {
      return source.toString();
    },
  };
}
