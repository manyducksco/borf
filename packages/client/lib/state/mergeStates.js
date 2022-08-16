import $$observable from "symbol-observable";
import { getProperty } from "../helpers/getProperty.js";
import { mapState } from "./makeState.js";
import { isFunction, isObject } from "../helpers/typeChecking.js";
import { deepEqual } from "../helpers/deepEqual.js";

/**
 * Combine multiple states into one.
 *
 * @example
 * const $multiplied = mergeStates([$number1, $number2], (values) => {
 *   return values[0] * values[1];
 * });
 */
export function mergeStates(states, merge) {
  if (!isFunction(merge)) {
    throw new TypeError(`Second argument should be a function. Got: ${merge}`);
  }

  let observers = [];
  let currentValue;
  let observing = false;

  let subscriptions = [];
  let values = [];

  function updateValue() {
    const value = merge(values);

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

  return {
    get(...selectors) {
      let value;

      if (observing) {
        value = currentValue;
      } else {
        value = merge(states.map((state) => state.get()));
      }

      for (const selector of selectors) {
        value = getProperty(value, selector);
      }

      return value;
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

    map(...selectors) {
      return mapState(this, (value) => {
        for (const selector of selectors) {
          value = getProperty(value, selector);
        }

        return value;
      });
    },

    toString() {
      return String(this.get());
    },

    [$$observable]() {
      return this;
    },

    get isState() {
      return true;
    },
  };
}
