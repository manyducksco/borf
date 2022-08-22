import $$observable from "symbol-observable";
import produce from "immer";
import { isFunction, isObject } from "../helpers/typeChecking.js";
import { deepEqual } from "../helpers/deepEqual.js";

/**
 * Creates a state container in the form of a function.
 *
 * @param initialValue - Optional starting value
 */
export function makeState(initialValue) {
  let currentValue = produce(initialValue, (x) => x);
  let observers = [];

  return {
    get(callbackFn) {
      if (callbackFn) {
        return callbackFn(currentValue);
      } else {
        return currentValue;
      }
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

    map(callbackFn = null) {
      return mapState(this, callbackFn);
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

    [$$observable]() {
      return this;
    },

    [Symbol.toStringTag]() {
      return "State";
    },

    get isState() {
      return true;
    },
  };
}

/**
 * Creates a state whose value is a result of running a source state's value through a transform function.
 *
 * @param sourceState - Source state
 * @param transformFn - Function that takes source's value and returns a new value
 */
export function mapState(sourceState, transformFn = null) {
  if (transformFn == null) {
    transformFn = (x) => x;
  } else if (!isFunction(transformFn)) {
    throw new TypeError(`.map() expected a transform function or null/undefined. Got: ${typeof transformFn}`);
  }

  return {
    get(callbackFn = null) {
      let value = sourceState.get();

      if (transformFn) {
        value = transformFn(value);
      }

      if (callbackFn) {
        value = callbackFn(value);
      }

      return value;
    },

    map(callbackFn = null) {
      return mapState(this, callbackFn);
    },

    subscribe(observer) {
      if (typeof observer !== "object" || observer === null) {
        observer = {
          next: observer,
          error: arguments[1],
          complete: arguments[2],
        };
      }

      let previous;

      return sourceState.subscribe((value) => {
        value = transformFn(value);

        if (!deepEqual(value, previous)) {
          previous = value;
          observer.next(value);
        }
      });
    },

    [$$observable]() {
      return this;
    },

    [Symbol.toStringTag]() {
      return "State";
    },

    get isState() {
      return true;
    },
  };
}
