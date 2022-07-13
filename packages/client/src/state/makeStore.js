import produce from "immer";
import { isFunction } from "../helpers/typeChecking.js";
import { makeState } from "./makeState.js";

/**
 * Creates a state that persists its value to localStorage (or sessionStorage).
 *
 * @param key - A string to identify the stored value.
 * @param defaultValue - Value to use if no value was stored.
 * @param options - Customize how makeStore works. Set `options.session = true` to use sessionStorage.
 */
export function makeStore(key, defaultValue, options) {
  options = options || {};

  const storage = options.session ? sessionStorage : localStorage;

  const stored = storage.getItem(key);
  const initialValue = stored ? JSON.parse(stored) : defaultValue;

  // Store initial value if none was stored.
  if (stored == null && initialValue != null) {
    storage.setItem(key, JSON.stringify(initialValue));
  }

  const $state = makeState(initialValue);

  return {
    ...$state,

    set(value) {
      if (isFunction(value)) {
        // Produce a new value from a mutated draft with immer.
        value = produce(current, value);
      }

      $state.set(value);

      storage.setItem(key, JSON.stringify(value));
    },

    get isState() {
      return true;
    },
  };
}
