import { isArray, isFunction, isObject } from "../_helpers/typeChecking.js";

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
 *   methods: {
 *     increment: value => value + 1,
 *     decrement: value => value - 1,
 *     add: (value, amount) => value + amount,
 *     subtract: (value, amount) => value - amount
 *   }
 * });
 * count.increment();
 * count.decrement();
 * count.add(5);
 * count.subtract(3);
 *
 * @param initialValue - Starting value (optional)
 * @param options - Configure this state (supports `immutable` bool and `methods` object)
 */
export function state(initialValue, options) {
  options = options || {};

  let value = initialValue;
  let listeners = [];
  let isInnerSet = false;

  function instance(one, two) {
    // Calling with a context and a function adds the listener and pushes the cancel function into context.cancellers.
    if (two) {
      if (isObject(one) && isArray(one.cancellers) && isFunction(two)) {
        listeners.push(two);

        if (listeners.length > 10) {
          console.trace(
            `State has ${
              listeners.length
            } listeners. Possible memory leak. Value: ${JSON.stringify(value)}`
          );
        }

        const cancel = function () {
          listeners.splice(listeners.indexOf(one), 1);
        };

        one.cancellers.push(cancel);

        return cancel;
      }

      throw new TypeError(
        `Expected a context object and a listener function. Received: ${one} and ${two}`
      );
    }

    // Calling with a function adds it as a listener.
    if (one instanceof Function) {
      listeners.push(one);

      if (listeners.length > 10) {
        console.trace(
          `State has ${
            listeners.length
          } listeners. Possible memory leak. Value: ${JSON.stringify(value)}`
        );
      }

      return function () {
        listeners.splice(listeners.indexOf(one), 1);
      };
    }

    if (one !== undefined) {
      if (!isInnerSet && options.immutable) {
        throw new Error(
          `Immutable states can only be set through their methods. Received: ${one}`
        );
      }

      if (one !== value) {
        value = one;

        const cancelled = [];

        for (const listener of listeners) {
          // pass the value and a cancel function
          listener(value, () => {
            cancelled.push(listener);
          });
        }

        listeners = listeners.filter((x) => !cancelled.includes(x));
      }
    }

    isInnerSet = false;
    return value;
  }

  if (options.methods) {
    const { methods } = options;

    // Add methods to exported function with prefilled value argument.
    for (const method in methods) {
      instance[method] = function (...args) {
        const newValue = methods[method](value, ...args);

        if (isFunction(newValue)) {
          throw new TypeError(`State methods cannot return functions.`);
        }

        isInnerSet = true;
        instance(newValue);

        return instance;
      };
    }
  }

  instance.toString = function () {
    return value.toString();
  };

  instance.isState = true;

  return instance;
}

/**
 * Receives values modified by a `transform` function.
 *
 * @param source - State to receive values from.
 * @param transform - Function to transform values before receiving.
 */
state.map = function map(source, transform) {
  let stored;

  return function (one, two) {
    if (two) {
      if (isObject(one) && isArray(one.cancellers) && isFunction(two)) {
        const cancel = source(one, (value) => {
          const t = transform(value);
          if (t !== undefined) {
            stored = t;
            two(t, cancel);
          }
        });

        return cancel;
      }

      throw new TypeError(
        `Expected a context object and a listener function. Received: ${one} and ${two}`
      );
    }

    if (one instanceof Function) {
      // Listen for changes to source.
      const cancel = source((value) => {
        // Transform the value and, if not undefined, store and notify listener.
        const t = transform(value);
        if (t !== undefined) {
          stored = t;
          one(t, cancel);
        }
      });

      return cancel;
    }

    if (one !== undefined) {
      throw new Error(`Read only states cannot be set. Received: ${one}`);
    }

    // Calling without listener returns the value.
    const t = transform(source());
    if (t !== undefined) {
      stored = t;
    }

    return stored;
  };
};

/**
 * Takes any number of states followed by a function. This function takes the states as arguments
 * and returns a new value for this state whenever any of the dependent states gets a new value.
 */
state.combine = function combine(...args) {
  const fn = args.pop();
  const states = args;
  const listeners = [];

  const initialValue = fn(...states.map((s) => s()));
  const value = state(initialValue, {
    immutable: true,
    methods: {
      _set: (current, newValue) => newValue,
    },
  });

  for (const item of states) {
    listeners.push(
      item(() => {
        value._set(fn(...states.map((s) => s())));
      })
    );
  }

  return value;
};
