import { isFunction } from "../_helpers/typeChecking";

/**
 * Creates a state container in the form of a function. This function can be called three ways with different results.
 *
 * @example
 * const count = state(0);
 *
 * count(); // returns 0
 * count(1); // sets value to 1
 * const cancel = count((n, cancel) => {
 *   // listen for changes
 *   cancel(); // cancel at any time from within the listener
 * });
 * cancel(); // cancel from outside the listener
 *
 * const count = state(0, {
 *   increment: value => value + 1,
 *   decrement: value => value - 1,
 *   add: (value, amount) => value + amount,
 *   subtract: (value, amount) => value - amount
 * });
 * count.increment();
 * count.decrement();
 * count.add(5);
 * count.subtract(3);
 *
 * @param initialValue - Starting value (optional)
 * @param methods - Methods taking a value and returning an updated value
 */
export function state(initialValue, methods = {}) {
  let value = initialValue;
  let listeners = [];

  function action(arg) {
    if (arg instanceof Function) {
      listeners.push(arg);

      return function () {
        listeners.splice(listeners.indexOf(arg), 1);
      };
    }

    if (arg !== undefined && value !== arg) {
      value = arg;

      const cancelled = [];

      for (const listener of listeners) {
        // pass the value and a cancel function
        listener(value, () => {
          cancelled.push(listener);
        });
      }

      listeners = listeners.filter((x) => !cancelled.includes(x));
    }

    return value;
  }

  // Add methods to exported function with prefilled value argument.
  for (const method in methods) {
    action[method] = function (...args) {
      const updated = methods[method](value, ...args);

      if (isFunction(updated)) {
        throw new TypeError(`State methods cannot return functions.`);
      }

      action(updated);
    };
  }

  return action;
}

/**
 * Receives values modified by a `transform` function.
 *
 * @param source - State to receive values from.
 * @param transform - Function to transform values before receiving.
 */
state.map = function map(source, transform) {
  let stored;

  return function (listener) {
    if (listener instanceof Function) {
      const cancel = source((value) => {
        const t = transform(value);
        if (t !== undefined) {
          stored = t;
          listener(t, cancel);
        }
      });

      return cancel;
    }

    if (listener !== undefined) {
      throw new Error("Tried to set a read only state.");
    }

    const t = transform(source());
    if (t !== undefined) {
      stored = t;
    }

    return stored;
  };
};

/**
 * Receives values for which the condition returns truthy.
 *
 * @param source - State to receive values from.
 * @param condition - Function to decide whether to receive the value.
 */
state.filter = function filter(source, condition) {
  return this.map(source, (value) => {
    if (condition(value)) return value;
  });
};
