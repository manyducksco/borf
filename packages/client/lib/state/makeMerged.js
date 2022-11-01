import { isArray, isBinding, isFunction, isObject } from "../helpers/typeChecking.js";
import { deepEqual } from "../helpers/deepEqual.js";
import OBSERVABLE from "symbol-observable";
import { transformed } from "../helpers/makeState.js";

export function makeMerged(...args) {
  // form 2. ({ name: binding }) -> { name: value }
  if (isObject(args[0]) && !isBinding(args[0])) {
    const keys = [];
    const sources = [];

    for (const [key, source] of Object.entries(args[0])) {
      keys.push(key);
      sources.push(source);
    }

    return merged(sources, (...values) => {
      const result = {};

      for (let i = 0; i < values.length; i++) {
        result[keys[i]] = values[i];
      }

      return result;
    });
  }

  // form 3. ([...bindings]) -> [...values]
  if (isArray(args[0])) {
    return merged(args[0], (...values) => [...values]);
  }

  // form 1. (...bindings, (...values) => result) -> result
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
