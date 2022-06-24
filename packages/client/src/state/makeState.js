import produce from "immer";
import { getProperty } from "./getProperty.js";
import { isFunction, isObject, isString } from "../helpers/typeChecking.js";
import { deepEqual } from "../helpers/deepEqual.js";

/**
 * Creates a state container in the form of a function.
 *
 * @param initialValue - Optional starting value
 */
export function makeState(initialValue) {
  let current = initialValue;
  let watchers = [];

  return {
    get(...args) {
      let value = current;

      for (const selector of args) {
        value = getProperty(value, selector);
      }

      return value;
    },

    set(value) {
      if (isFunction(value)) {
        // Produce a new value from a mutated draft with immer.
        value = produce(current, (draft) => value(draft));
      }

      if (!deepEqual(current, value)) {
        current = value;

        for (const callback of watchers) {
          callback(current);
        }
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
        callback(current);
      }

      watchers.push(callback);

      return function unwatch() {
        watchers.splice(watchers.indexOf(callback), 1);
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
      return String(current);
    },

    get isState() {
      return true;
    },
  };
}

/**
 * Creates a state whose value is a result of running a source state's value through a transform function.
 *
 * @param source - Source state
 * @param transform - Function that takes source's value and returns a new value
 */
export function mapState(source, transform) {
  return {
    get(...args) {
      let value = transform(source.get());

      for (const selector of args) {
        value = getProperty(value, selector);
      }

      return value;
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
        throw new TypeError(`Expected a watcher function. Received: ${callback}`);
      }

      if (key) {
        let fn = callback;
        callback = (value) => {
          return fn(getProperty(value, key));
        };
      }

      let previous = undefined;

      return source.watch((value) => {
        value = transform(value);

        if (!deepEqual(value, previous)) {
          previous = value;
          callback(value);
        }
      }, options);
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
      return source.toString();
    },

    get isState() {
      return true;
    },
  };
}
