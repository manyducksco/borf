import OBSERVABLE from "symbol-observable";
import { isFunction, isObject } from "../helpers/typeChecking.js";
import { deepEqual } from "../helpers/deepEqual.js";
import { makeTransformed } from "./makeWritable.js";

export function makeMerged(...args) {
  const callback = args.pop();

  if (!isFunction(callback)) {
    throw new TypeError(`Expected a callback function as the final argument. Got: ${typeof callback}`);
  }

  return merged(args, callback);
}

export function merged(sources, mergeFn) {
  let observers = [];
  let currentValue;
  let observing = false;

  let subscriptions = [];
  let values = [];

  function updateValue() {
    const value = mergeFn(...values);

    if (!deepEqual(value, currentValue)) {
      currentValue = value;

      for (const observer of observers) {
        observer.next(currentValue);
      }
    }
  }

  function subscribeToSources() {
    if (!observing) {
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];

        subscriptions.push(
          source.subscribe({
            next: (value) => {
              values[i] = value;

              if (observing) {
                updateValue();
              }
            },
          })
        );
      }

      observing = true;

      updateValue();
    }
  }

  function unsubscribeFromSources() {
    observing = false;

    for (const subscription of subscriptions) {
      subscription.unsubscribe();
    }
  }

  const binding = {
    get() {
      let value;

      if (observing) {
        value = currentValue;
      } else {
        value = mergeFn(...sources.map((s) => s.get()));
      }

      return value;
    },

    as(transformFn = null) {
      if (transformFn == null) {
        transformFn = (x) => x;
      } else if (!isFunction(transformFn)) {
        throw new TypeError(`Expected a transform function. Got: ${typeof transformFn}`);
      }

      return makeTransformed(binding, transformFn);
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

      if (!observing) {
        subscribeToSources();
      } else {
        observer.next(this.get());
      }

      return {
        unsubscribe() {
          observers.splice(observers.indexOf(observer), 1);

          if (observers.length === 0) {
            unsubscribeFromSources();
          }
        },
      };
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
