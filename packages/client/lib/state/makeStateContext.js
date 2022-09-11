import produce from "immer";
import __observable from "symbol-observable";
import { deepEqual } from "../helpers/deepEqual";
import { isFunction, isObject, isObservable, isObserver, isString } from "../helpers/typeChecking";

export function makeStateContext() {
  const state = new Map();
  const observers = [];

  const broadcast = (key, value) => {
    const topLevel = [];

    for (const entry of observers) {
      if (entry.key == null) {
        topLevel.push(entry);
      } else if (entry.key === key) {
        entry.observer.next(value);
      }
    }

    // Then run whole state observers
    const _values = ctx.get();
    for (const entry of topLevel) {
      entry.observer.next(_values);
    }
  };

  const ctx = {
    get(...args) {
      if (args.length === 0) {
        const values = {};

        for (const [key, value] of state.entries()) {
          values[key] = value;
        }

        return values;
      }

      if (isString(args[0])) {
        // Get value of key
        return state.get(args[0]);
      }

      throw new TypeError(`Invalid arguments for 'get'`);
    },

    set(...args) {
      if (isString(args[0])) {
        if (args.length === 2) {
          let [key, value] = args;
          let current = ctx.get(key);

          if (isFunction(value)) {
            value = produce(current, value);
          }

          if (!deepEqual(current, value)) {
            state.set(key, value);
            broadcast(key, value);
          }
        } else {
          throw new Error(`Expected a value for '${args[0]}' as a second argument. Got: ${typeof args[0]}`);
        }
      }

      if (isObject(args[0])) {
        // Passed object with keys to patch.
        const [values] = args;

        for (const key in values) {
          ctx.set(key, values[key]);
        }
      }
    },

    observe(...args) {
      // Observe a separate observable.
      if (isObservable(args[0])) {
        return {
          start() {
            return args[0].subscribe(...args.slice(1));
          },
        };
      }

      let entry = {
        key: null,
        observer: null,
      };

      if (isObserver(args[0])) {
        // Observe whole state.
        entry.observer = args[0];
      } else if (isString(args[0])) {
        // Observe a specific key.
        entry.key = args[0];

        if (isObject(args[1])) {
          entry.observer = args[1];
        } else {
          entry.observer = {
            next: args[1],
            error: args[2],
            complete: args[3],
          };
        }
      } else {
        // Assume args are next, error, complete functions.
        entry.observer = {
          next: args[0],
          error: args[1],
          complete: args[2],
        };
      }

      return {
        start() {
          entry.observer.next(ctx.get(entry.key));
          observers.push(entry);

          return {
            unsubscribe() {
              observers.splice(observers.indexOf(entry), 1);
            },
          };
        },
      };
    },

    read(key) {
      return makeBinding(ctx, key, false);
    },

    readWrite(key) {
      return makeBinding(ctx, key, true);
    },
  };

  return ctx;
}

function makeBinding(ctx, key, writable = false) {
  const binding = {
    get() {
      return ctx.get(key);
    },

    to(transformFn) {
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

      return ctx.observe(key, observer).start();
    },
  };

  if (writable) {
    binding.set = (...args) => {
      ctx.set(key, ...args);
    };
  }

  Object.defineProperties(binding, {
    [__observable]: {
      value: () => binding,
    },
    isBinding: {
      value: true,
    },
    isWritable: {
      value: writable,
    },
  });

  return binding;
}

export function transformed(source, transformFn = null) {
  if (transformFn == null) {
    transformFn = (x) => x;
  } else if (!isFunction(transformFn)) {
    throw new TypeError(`.to() expected a transform function. Got: ${typeof transformFn}`);
  }

  const binding = {
    get() {
      let value = source.get();

      if (transformFn) {
        value = transformFn(value);
      }

      return value;
    },

    to(transformFn = null) {
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

      let previous;

      return source.subscribe((value) => {
        value = transformFn(value);

        if (!deepEqual(value, previous)) {
          previous = value;
          observer.next(value);
        }
      });
    },
  };

  Object.defineProperties(binding, {
    [__observable]: {
      value: () => binding,
    },
    isBinding: {
      value: true,
    },
  });

  return binding;
}
