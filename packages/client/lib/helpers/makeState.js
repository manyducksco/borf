import produce from "immer";
import OBSERVABLE from "symbol-observable";
import { deepEqual } from "./deepEqual.js";
import { isBinding, isFunction, isObject, isObservable, isObserver, isString } from "./typeChecking.js";

export function makeState({ initialState, bindings, debug }) {
  const state = new Map(initialState || []);
  const observers = [];

  bindings = bindings || {};

  const broadcast = (key, value) => {
    const stateObservers = [];

    // Run key observers and separate out state observers for later.
    for (const entry of observers) {
      if (entry.key == null) {
        stateObservers.push(entry);
      } else if (entry.key === key) {
        entry.observer.next?.(value);
      }
    }

    // Then run state observers.
    if (stateObservers.length > 0) {
      const _values = ctx.get();
      for (const entry of stateObservers) {
        entry.observer.next?.(_values);
      }
    }
  };

  const ctx = {
    get(key) {
      if (!key) {
        const values = {};

        for (const [key, value] of state.entries()) {
          values[key] = value;
        }

        return values;
      }

      return state.get(key);
    },

    set(...args) {
      let values = {};

      if (isString(args[0])) {
        if (args.length === 2) {
          values[args[0]] = args[1];
        } else {
          throw new TypeError(`Expected a value for '${args[0]}' as a second argument. Got: ${typeof args[0]}`);
        }
      } else if (isObject(args[0])) {
        values = args[0];
      } else {
        throw new TypeError(`Expected a key or a key-value object as the first parameter. Got: ${typeof args[0]}`);
      }

      for (const key in values) {
        if (key === "children" || (bindings[key] && !bindings[key].isWritable)) {
          debug.warn(`Tried to set value for read-only binding '${key}'. This change will not apply.`);
          continue;
        }

        let value = values[key];
        let current = state.get(key);

        if (isFunction(value)) {
          value = produce(current, value);
        }

        if (!deepEqual(current, value)) {
          state.set(key, value);
          broadcast(key, value);

          // Update readWrite bindings.
          if (bindings[key]?.isWritable) {
            bindings[key].set(value);
          }
        }
      }
    },

    unset(key) {
      if (state.has(key)) {
        state.delete(key);
        broadcast(key, undefined);
      }
    },

    readable(key) {
      return makeBinding(ctx, key, false);
    },

    writable(key) {
      return makeBinding(ctx, key, true);
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
        key: undefined,
        observer: undefined,
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
          entry.observer.next?.(ctx.get(entry.key));
          observers.push(entry);

          return {
            unsubscribe() {
              observers.splice(observers.indexOf(entry), 1);
            },
          };
        },
      };
    },

    merge(...args) {
      const fn = args.pop();
      if (!isFunction(fn)) {
        throw new TypeError(`Final argument must be a merge function.`);
      }

      if (args.length === 0) {
        return merged([ctx.readable()], fn);
      }

      const sources = [];

      for (const arg of args) {
        if (isString(arg)) {
          sources.push(ctx.readable(arg));
        } else if (isBinding(arg)) {
          sources.push(arg);
        } else {
          throw new TypeError(`Arguments to merge must be keys or bindings.`);
        }
      }

      return merged(sources, fn);
    },
  };

  // Updates a bound value without triggering the usual warnings and stuff the external set function uses.
  const updateBoundValue = (key, value) => {
    let current = state.get(key);

    if (isFunction(value)) {
      value = produce(current, value);
    }

    if (!deepEqual(current, value)) {
      state.set(key, value);
      broadcast(key, value);
    }
  };

  return [ctx, updateBoundValue];
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
      if (key) {
        return ctx.observe(key, observer).start();
      } else {
        return ctx.observe(observer).start();
      }
    },
  };

  if (writable) {
    binding.set = (...args) => {
      ctx.set(key, ...args);
    };

    binding.unset = (key) => {
      ctx.unset(key);
    };

    binding.readable = () => {
      return ctx.readable(key);
    };
  }

  Object.defineProperties(binding, {
    [OBSERVABLE]: {
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
    [OBSERVABLE]: {
      value: () => binding,
    },
    isBinding: {
      value: true,
    },
  });

  return binding;
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
  });

  return binding;
}
