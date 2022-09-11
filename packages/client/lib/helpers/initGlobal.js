import { isObject, isString } from "./typeChecking.js";
import { __appContext } from "../keys.js";
import { makeStateContext } from "../state/makeStateContext.js";

export function initGlobal(globalFn, { appContext, name, debugTag }) {
  // Lifecycle hook callbacks
  const onBeforeConnect = [];
  const onAfterConnect = [];

  // Subscriptions for observables observed through subscribeTo
  const subscriptions = [];

  const debug = appContext.debug.makeChannel(debugTag || `global:${name}`);
  const state = makeStateContext();

  const ctx = {
    [__appContext]: appContext,

    set defaultState(values) {
      state.set(values);
    },

    ...state,

    global(name) {
      if (!isString(name)) {
        throw new TypeError("Expected a string.");
      }

      if (appContext.services[name]) {
        return appContext.services[name].exports;
      }

      throw new Error(`Global '${name}' is not registered on this app.`);
    },

    beforeConnect(callback) {
      onBeforeConnect.push(callback);
    },

    afterConnect(callback) {
      onAfterConnect.push(callback);
    },

    observe(...args) {
      const observer = state.observe(...args);
      subscriptions.push(observer.start());
    },
  };

  Object.defineProperties(ctx, Object.getOwnPropertyDescriptors(debug));

  const exports = globalFn.call(ctx);

  if (!isObject(exports)) {
    throw new TypeError(`A global must return an object. Got: ${exports}`);
  }

  const service = {
    state,
    exports,

    /**
     * Called by the App to fire lifecycle callbacks as the app is initialized.
     */
    beforeConnect() {
      for (const callback of onBeforeConnect) {
        callback();
      }
    },

    /**
     * Called by the App to fire lifecycle callbacks as the app is initialized.
     */
    afterConnect() {
      for (const callback of onAfterConnect) {
        callback();
      }
    },
  };

  Object.defineProperty(service, "isService", {
    value: true,
    writable: false,
    enumerable: true,
    configurable: false,
  });

  return service;
}
