import $$observable from "symbol-observable";
import { isFunction, isState } from "../helpers/typeChecking.js";
import { deepEqual } from "../helpers/deepEqual.js";
import { produce } from "./produce.js";
import { mapState } from "./makeState.js";
import { getProperty } from "./getProperty.js";
import { cloneDeep } from "../helpers/cloneDeep.js";

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

  return {
    get(...selectors) {
      if ($target) {
        return $target.get(...selectors);
      } else {
        let value = currentValue;

        for (const selector of selectors) {
          value = getProperty(value, selector);
        }

        return cloneDeep(value);
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

    map(...selectors) {
      return mapState(this, (value) => {
        for (const selector of selectors) {
          value = getProperty(value, selector);
        }

        return value;
      });
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

    toString() {
      return $target.toString();
    },

    [$$observable]() {
      return this;
    },

    get isState() {
      return true;
    },
  };
}
