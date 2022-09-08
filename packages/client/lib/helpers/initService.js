import { isObject, isString } from "./typeChecking.js";
import { $$appContext } from "../keys.js";

export function initService(serviceFn, { appContext, name }) {
  // Lifecycle hook callbacks
  const onBeforeConnect = [];
  const onAfterConnect = [];

  // Subscriptions for observables observed through subscribeTo
  const subscriptions = [];

  const ctx = {
    [$$appContext]: appContext,
    debug: appContext.debug.makeChannel(`service:${name}`),

    getService(name) {
      if (isString(name)) {
        if (appContext.services[name]) {
          return appContext.services[name];
        }
        throw new Error(`Service '${name}' is not registered on this app.`);
      } else if (isArrayOf(isString, name)) {
        return name.map(ctx.getService);
      } else {
        throw new TypeError(`Expected a service name or array of service names.`);
      }
    },
    beforeConnect: (callback) => {
      onBeforeConnect.push(callback);
    },
    afterConnect: (callback) => {
      onAfterConnect.push(callback);
    },
    subscribeTo: (observable, ...args) => {
      subscriptions.push(observable.subscribe(...args));
    },
  };

  const exports = serviceFn.call(ctx);

  if (!isObject(exports)) {
    throw new TypeError(`A service must return an object. Got: ${exports}`);
  }

  const service = {
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
