import { getProperty } from "./getProperty.js";
import { mapState } from "./makeState.js";
import { isString, isFunction, isObject } from "../helpers/typeChecking.js";
import { deepEqual } from "../helpers/deepEqual.js";

export function mergeStates(...args) {
  const merge = args.pop();
  const states = args;

  if (!isFunction(merge)) {
    throw new TypeError(`Last argument should be a function. Got: ${merge}`);
  }

  return {
    get(key) {
      const value = merge(...states.map((state) => state.get()));

      if (key !== undefined) {
        return getProperty(value, key);
      } else {
        return value;
      }
    },

    watch(...args) {
      let key;
      let callback;
      let options = {};

      if (isString(args[0])) {
        key = args.shift();
      }

      if (isFunction(args[0])) {
        callback = args.shift();
      }

      if (isObject(args[0])) {
        options = args.shift();
      }

      if (!isFunction(callback)) {
        throw new TypeError(`Expected a watcher function but none was passed. Received: ${args}`);
      }

      if (key) {
        // Track changes to this particular key and only fire when its value changes.
        let previous = undefined;

        let fn = callback;
        callback = (value) => {
          value = getProperty(value, key);

          if (!deepEqual(value, previous)) {
            previous = value;
            return fn(value);
          }
        };
      }

      if (options.immediate) {
        callback(this.get(key));
      }

      const watchers = [];

      for (const state of states) {
        watchers.push(
          state.watch(() => {
            callback(this.get());
          })
        );
      }

      return function unwatch() {
        for (const unwatch of watchers) {
          unwatch();
        }
      };
    },

    map(...args) {
      let key;
      let transform = (x) => x;

      if (isString(args[0])) {
        key = args.shift();
      }

      if (isFunction(args[0])) {
        transform = args.shift();
      }

      if (key) {
        let fn = transform;
        transform = (value) => {
          return fn(getProperty(value, key));
        };
      }

      return mapState(this, transform);
    },

    toString() {
      return String(this.get());
    },

    get isState() {
      return true;
    },
  };
}
