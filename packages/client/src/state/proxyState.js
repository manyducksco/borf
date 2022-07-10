import { produce } from "immer";
import { isFunction, isString, isObject, isState } from "../helpers/typeChecking.js";
import { deepEqual } from "../helpers/deepEqual.js";
import { mapState } from "./makeState.js";
import { getProperty } from "./getProperty.js";

/**
 * Creates a state container that proxies the value of another state.
 *
 * @param initialValue - Optional starting value or target state.
 */
export function proxyState(initialValue) {
  let $target;
  let current;
  let watchers = [];

  if (isState(initialValue)) {
    $target = initialValue;
    current = initialValue.get();
  } else {
    current = initialValue;
  }

  let unwatchTarget;

  function watchTarget() {
    if (unwatchTarget) {
      unwatchTarget();
    }

    unwatchTarget = $target.watch(
      (value) => {
        if (!deepEqual(value, current)) {
          current = value;

          for (const callback of watchers) {
            callback(current);
          }
        }
      },
      { immediate: true }
    );
  }

  return {
    get(...args) {
      if ($target) {
        current = $target.get(...args);
      }

      return current;
    },

    set(value) {
      if (isFunction(value)) {
        // Produce a new value from a mutated draft with immer.
        value = produce(current, (draft) => value(draft));
      }

      if ($target) {
        $target.set(value);
      } else {
        if (!deepEqual(current, value)) {
          current = value;

          for (const callback of watchers) {
            callback(current);
          }
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

        if (watchers.length === 0 && unwatchTarget) {
          unwatchTarget();
          unwatchTarget = null;
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

    /**
     * Set the proxy target to a new state.
     */
    proxy(target) {
      if (!isState(target)) {
        throw new TypeError(`Proxy takes a state. Got: ${typeof target}`);
      }

      $target = target;

      if (watchers.length > 0) {
        watchTarget();
      }
    },

    unproxy() {
      $target = null;

      if (unwatchTarget) {
        unwatchTarget();
      }
    },

    toString() {
      return $target.toString();
    },

    get isState() {
      return true;
    },
  };
}
