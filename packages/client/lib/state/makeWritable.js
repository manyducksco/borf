import produce from "immer";
import OBSERVABLE from "symbol-observable";
import { deepEqual } from "../helpers/deepEqual.js";
import { isFunction, isObject } from "../helpers/typeChecking.js";
import { omit } from "../helpers/omit.js";

export function makeWritable(initialValue) {
  let currentValue = initialValue;

  const observers = [];

  const broadcast = () => {
    // Run key observers and separate out state observers for later.
    for (const observer of observers) {
      observer.next?.(currentValue);
    }
  };

  const ctx = {
    get() {
      return currentValue;
    },

    set(newValue) {
      if (!deepEqual(currentValue, newValue)) {
        currentValue = newValue;
        broadcast();
      }
    },

    unset() {
      if (!deepEqual(currentValue, undefined)) {
        currentValue = undefined;
        broadcast();
      }
    },

    update(callback) {
      if (!isFunction(callback)) {
        throw new TypeError("Expected second argument to be an update callback function. Got: " + typeof callback);
      }

      const newValue = produce(currentValue, callback);

      if (!deepEqual(currentValue, newValue)) {
        currentValue = newValue;
        broadcast();
      }
    },

    readable() {
      return makeReadable(ctx);
    },

    as(transformFn) {
      if (transformFn == null) {
        transformFn = (x) => x;
      } else if (!isFunction(transformFn)) {
        throw new TypeError(`Expected a transform function. Got: ${typeof transformFn}`);
      }

      return transformed(ctx, transformFn);
    },

    subscribe(observer) {
      if (!isObject(observer)) {
        observer = {
          next: observer,
          error: arguments[1],
          complete: arguments[2],
        };
      }

      observers.push(observer);
      observer.next?.(currentValue);

      return {
        unsubscribe() {
          observers.splice(observers.indexOf(observer), 1);
        },
      };
    },
  };

  Object.defineProperties(ctx, {
    [OBSERVABLE]: {
      value: () => ctx,
    },
    isBinding: {
      value: true,
    },
    isWritable: {
      value: true,
    },
  });

  return ctx;
}

function makeReadable(ctx) {
  const readable = omit(["set", "unset", "update", "readable"], ctx);

  Object.defineProperties(readable, {
    [OBSERVABLE]: {
      value: () => readable,
    },
    isBinding: {
      value: true,
    },
    isWritable: {
      value: false,
    },
  });

  return readable;
}

export function transformed(source, transformFn) {
  const binding = {
    get() {
      let currentValue = source.get();

      if (transformFn) {
        currentValue = transformFn(currentValue);
      }

      return currentValue;
    },

    as(transformFn = null) {
      if (transformFn == null) {
        transformFn = (x) => x;
      } else if (!isFunction(transformFn)) {
        throw new TypeError(`Expected a transform function. Got: ${typeof transformFn}`);
      }

      return transformed(binding, transformFn);
    },

    subscribe(observer) {
      if (!isObject(observer)) {
        observer = {
          next: observer,
          error: arguments[1],
          complete: arguments[2],
        };
      }

      let oldValue;

      return source.subscribe((currentValue) => {
        const newValue = transformFn(currentValue);

        if (!deepEqual(newValue, oldValue)) {
          oldValue = newValue;
          observer.next(newValue);
        }
      });
    },
  };

  Object.defineProperties(binding, {
    [OBSERVABLE]: {
      value: () => binding,
    },
    isBinding: {
      value: true,
    },
    isWritable: {
      value: false,
    },
  });

  return binding;
}
