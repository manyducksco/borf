import { isObject, isString } from "../helpers/typeChecking.js";
import { APP_CONTEXT } from "../keys.js";
import { makeState } from "./makeState.js";

import debug from "../globals/debug.js";

export function initGlobal(fn, { appContext, name, channelPrefix }) {
  channelPrefix = channelPrefix || "global";

  // Lifecycle hook callbacks
  const beforeConnectCallbacks = [];
  const afterConnectCallbacks = [];

  // Subscriptions for observables observed through subscribeTo
  const subscriptions = [];

  // Exception because debug global doesn't exist yet when initializing the debug global.
  const channel = fn === debug ? {} : appContext.globals.debug.exports.channel(`${channelPrefix}:${name}`);
  const [state] = makeState({ debug: channel });

  const ctx = {
    [APP_CONTEXT]: appContext,

    ...channel,
    ...state,

    set defaultState(values) {
      // Set defaults only if they haven't been set already.
      for (const key in values) {
        if (state.get(key) === undefined) {
          state.set(key, values[key]);
        }
      }
    },

    get name() {
      return channel.name;
    },
    set name(value) {
      channel.name = `${channelPrefix}:${value}`;
    },

    /**
     * Creates a function that takes a new value when called with one.
     * Returns the last value it was called with when called without a value.
     *
     * Used for getting quick references to HTML elements or other values in custom views.
     */
    ref(initialValue) {
      let currentValue = initialValue;

      return function (newValue) {
        if (newValue === undefined) {
          return currentValue;
        }

        currentValue = newValue;
      };
    },

    global(name) {
      if (!isString(name)) {
        throw new TypeError("Expected a string.");
      }

      if (appContext.globals[name]) {
        return appContext.globals[name].exports;
      }

      throw new Error(`Global '${name}' is not registered on this app.`);
    },

    beforeConnect(callback) {
      beforeConnectCallbacks.push(callback);
    },

    afterConnect(callback) {
      afterConnectCallbacks.push(callback);
    },

    observe(...args) {
      const observer = state.observe(...args);
      subscriptions.push(observer.start());
    },
  };

  const exports = fn(ctx);

  if (!isObject(exports)) {
    throw new TypeError(`A global must return an object. Got: ${exports}`);
  }

  return {
    state,
    exports,
    beforeConnect() {
      for (const callback of beforeConnectCallbacks) {
        callback();
      }
    },
    afterConnect() {
      for (const callback of afterConnectCallbacks) {
        callback();
      }
    },
  };
}
