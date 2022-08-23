import $$observable from "symbol-observable";
import { produce } from "immer";
import { isFunction, isState } from "../helpers/typeChecking.js";
import { deepEqual } from "../helpers/deepEqual.js";
import { mapState } from "./makeState.js";

/**
 * Creates a state container that proxies the value of another state.
 *
 * @param initialValue - Optional starting value or target state.
 */
export function makeProxyState(initialValue) {
  let $target;
  let currentValue;
  let observers = [];
  let subscription;

  if (isState(initialValue)) {
    $target = initialValue;
  } else {
    currentValue = initialValue;
  }

  function updateValue(value) {
    if (!deepEqual(value, currentValue)) {
      currentValue = value;

      for (const observer of observers) {
        observer.next(currentValue);
      }
    }
  }

  function subscribeToTarget() {
    if ($target && !subscription) {
      subscription = $target.subscribe({
        next: updateValue,
      });
    }
  }

  function unsubscribeFromTarget() {
    if (subscription) {
      subscription.unsubscribe();
      subscription = null;
    }
  }

  const state = {
    get(callbackFn) {
      if ($target) {
        return $target.get(callbackFn);
      } else {
        let value = currentValue;

        if (callbackFn) {
          value = produce(value, callbackFn);
        }

        return value;
      }
    },

    set(value) {
      if (isFunction(value)) {
        value = produce(currentValue, value);
      }

      if ($target) {
        $target.set(value);
      } else {
        updateValue(value);
      }
    },

    map(callbackFn = null) {
      return mapState(state, callbackFn);
    },

    subscribe(observer) {
      if (typeof observer !== "object" || observer === null) {
        observer = {
          next: observer,
          error: arguments[1],
          complete: arguments[2],
        };
      }

      observers.push(observer);

      if (!subscription) {
        subscribeToTarget();
      } else {
        observer.next(currentValue);
      }

      return {
        unsubscribe() {
          observers.splice(observers.indexOf(observer), 1);

          if (observers.length === 0) {
            unsubscribeFromTarget();
          }
        },
      };
    },

    /**
     * Set the proxy target to a new state.
     */
    proxy($state) {
      if (!isState($state)) {
        throw new TypeError(`Proxy takes a state. Got: ${typeof $state}`);
      }

      if ($state !== $target) {
        unsubscribeFromTarget();

        $target = $state;

        if (observers.length > 0) {
          subscribeToTarget();
        }
      }
    },

    unproxy() {
      unsubscribeFromTarget();
      $target = null;
    },
  };

  Object.defineProperties(state, {
    [$$observable]: {
      value: () => state,
    },
    [Symbol.toStringTag]: {
      value: () => "ProxyState",
    },
    isState: {
      value: true,
    },
  });

  return state;
}
