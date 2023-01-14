import produce from "immer";
import OBSERVABLE from "symbol-observable";
import { READABLE, WRITABLE } from "./keys.js";
import { deepEqual } from "./helpers/deepEqual.js";
import { isFunction, isObject } from "./helpers/typeChecking.js";
import { omit } from "./helpers/omit.js";

/**
 * Creates a writable state container.
 *
 * @param initialValue
 */
export function makeState(initialValue) {
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

    update(callback) {
      if (!isFunction(callback)) {
        throw new TypeError(`Expected an update function. Got: ${typeof callback}`);
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
      if (!isFunction(transformFn)) {
        throw new TypeError(`Expected a transform function. Got: ${typeof transformFn}`);
      }

      return transformState(ctx, transformFn);
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
    [READABLE]: {
      value: () => ctx,
    },
    [WRITABLE]: {
      value: () => ctx,
    },
  });

  return ctx;
}

/**
 * Creates a readable version of a writable state container.
 *
 * @param ctx - Context object of a writable container.
 */
function makeReadable(ctx) {
  const readable = omit(["set", "update", "readable"], ctx);

  Object.defineProperties(readable, {
    [OBSERVABLE]: {
      value: () => readable,
    },
    [READABLE]: {
      value: () => readable,
    },
  });

  return readable;
}

/**
 * Creates a readable version of a writable state container whose value is determined by running the writable state's
 * latest value through a transform function each time it changes.
 *
 * @param source - Original state container.
 * @param transformFn - Function to transform values.
 */
function transformState(source, transformFn) {
  const binding = {
    get() {
      let currentValue = source.get();

      if (transformFn) {
        currentValue = transformFn(currentValue);
      }

      return currentValue;
    },

    as(transformFn) {
      if (!isFunction(transformFn)) {
        throw new TypeError(`Expected a transform function. Got: ${typeof transformFn}`);
      }

      return transformState(binding, transformFn);
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
    [READABLE]: {
      value: () => binding,
    },
  });

  return binding;
}

/**
 * Creates a readable state by passing the values of several states through a merge function to produce a new value.
 *
 * @param args - Two or more state bindings to merge followed by a merge function.
 */
export function joinStates(...args) {
  let mergeFn = args.pop();
  let sources = args;

  if (!isFunction(mergeFn)) {
    throw new TypeError(`Expected a merge function as the final argument. Got: ${typeof mergeFn}`);
  }

  let observers = [];
  let currentValue;
  let observing = false;

  let subscriptions = [];
  let values = [];

  function updateValue(force = false) {
    const value = mergeFn(...values);

    // Skip equality check on initial subscription to guarantee
    // that observers receive an initial value, even if undefined.
    if (force || !deepEqual(value, currentValue)) {
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

      updateValue(true);
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

    as(transformFn) {
      if (!isFunction(transformFn)) {
        throw new TypeError(`Expected a transform function. Got: ${typeof transformFn}`);
      }

      return transformState(binding, transformFn);
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

      if (observing) {
        observer.next?.(this.get());
      } else {
        subscribeToSources();
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
    [READABLE]: {
      value: () => binding,
    },
  });

  return binding;
}
