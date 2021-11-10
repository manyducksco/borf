/**
 * Returns a function that takes either:
 *  - nothing (returns the current value)
 *  - a new value to replace the current value (returns the new value)
 *  - a function to receive new values (returns a cancel function)
 */
export function state(initialValue) {
  let value = initialValue;

  const listeners = [];

  return function (arg) {
    if (arg instanceof Function) {
      listeners.push(arg);

      return function () {
        listeners.splice(listeners.indexOf(arg), 1);
      };
    }

    if (arg !== undefined) {
      value = arg;

      if (value !== undefined) {
        const cancelled = [];

        for (const listener of listeners) {
          // pass the value and a cancel function
          listener(value, () => {
            cancelled.push(listener);
          });
        }

        listeners.filter((x) => !cancelled.includes(x));
      }
    }

    return value;
  };
}

/**
 * Receives values modified by a `transform` function.
 *
 * @param source - State to receive values from.
 * @param transform - Function to transform values before receiving.
 */
state.map = function map(source, transform) {
  let stored;

  return function (listener = null) {
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
