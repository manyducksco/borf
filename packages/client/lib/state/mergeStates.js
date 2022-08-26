import $$observable from "symbol-observable";
import produce from "immer";
import { mapState } from "./makeState.js";
import { isFunction, isObject } from "../helpers/typeChecking.js";
import { deepEqual } from "../helpers/deepEqual.js";

/**
 * Combine multiple states into one.
 *
 * @example
 * const $multiplied = mergeStates($number1, $number2).into((one, two) => {
 *   return one * two;
 * });
 */
export function mergeStates(...states) {
  return {
    ...makeMergedState(states, (...values) => values),

    with(...moreStates) {
      return mergeStates(...states, ...moreStates);
    },

    into(mergeFn) {
      return makeMergedState(states, mergeFn);
    },
  };
}

function makeMergedState(states, mergeFn) {
  if (!isFunction(mergeFn)) {
    throw new TypeError(`Second argument should be a function. Got: ${mergeFn}`);
  }

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

  function subscribeToStates() {
    if (!observing) {
      for (let i = 0; i < states.length; i++) {
        const $state = states[i];

        subscriptions.push(
          $state.subscribe({
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

  function unsubscribeFromStates() {
    observing = false;

    for (const subscription of subscriptions) {
      subscription.unsubscribe();
    }
  }

  const state = {
    get(callbackFn = null) {
      let value;

      if (observing) {
        value = currentValue;
      } else {
        value = mergeFn(...states.map((state) => state.get()));
      }

      if (callbackFn) {
        value = produce(value, callbackFn);
      }

      return value;
    },

    map(callbackFn = null) {
      return mapState(state, callbackFn);
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
        subscribeToStates();
      } else {
        observer.next(this.get());
      }

      return {
        unsubscribe() {
          observers.splice(observers.indexOf(observer), 1);

          if (observers.length === 0) {
            unsubscribeFromStates();
          }
        },
      };
    },
  };

  Object.defineProperties(state, {
    [$$observable]: {
      value: () => state,
    },
    [Symbol.toStringTag]: {
      value: () => "State",
    },
    isState: {
      value: true,
    },
  });

  return state;
}
