import $$observable from "symbol-observable";
import { produce } from "immer";
import { getProperty } from "../helpers/getProperty.js";
import { isFunction, isObject } from "../helpers/typeChecking.js";
import { deepEqual } from "../helpers/deepEqual.js";

/**
 * Creates a state container in the form of a function.
 *
 * @param initialValue - Optional starting value
 */
export function makeState(initialValue) {
  let currentValue = initialValue;
  let observers = [];

  return {
    get(...selectors) {
      let value = currentValue;

      for (const selector of selectors) {
        value = getProperty(value, selector);
      }

      return value;
    },

    set(value) {
      if (isFunction(value)) {
        value = produce(currentValue, value);
      }

      if (!deepEqual(currentValue, value)) {
        currentValue = value;

        for (const observer of observers) {
          observer.next(currentValue);
        }
      }
    },

    /**
     * Subscribe to this state as an observable.
     *
     * @see https://github.com/tc39/proposal-observable
     */
    subscribe(observer) {
      if (!isObject(observer)) {
        observer = {
          next: observer,
          error: arguments[1],
          complete: arguments[2],
        };
      }

      observer.next(currentValue);

      observers.push(observer);

      return {
        unsubscribe() {
          observers.splice(observers.indexOf(observer), 1);
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
      return String(currentValue);
    },

    [$$observable]() {
      return this;
    },

    get isState() {
      return true;
    },
  };
}

/**
 * Creates a state whose value is a result of running a source state's value through a transform function.
 *
 * @param source - Source state
 * @param transform - Function that takes source's value and returns a new value
 */
export function mapState(source, transform) {
  return {
    get(...selectors) {
      let value = transform(source.get());

      for (const selector of selectors) {
        value = getProperty(value, selector);
      }

      return value;
    },

    /**
     * Subscribe to this state as an observable.
     *
     * @see https://github.com/tc39/proposal-observable
     */
    subscribe(observer) {
      if (typeof observer !== "object" || observer === null) {
        observer = {
          next: observer,
          error: arguments[1],
          complete: arguments[2],
        };
      }

      let previous;

      return source.subscribe((value) => {
        value = transform(value);

        if (!deepEqual(value, previous)) {
          previous = value;
          observer.next(value);
        }
      });
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
      return source.toString();
    },

    [$$observable]() {
      return this;
    },

    get isState() {
      return true;
    },
  };
}
