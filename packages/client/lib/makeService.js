import { isObject, isString } from "./helpers/typeChecking.js";
import { $$appContext } from "./keys.js";

/**
 * A container for state, methods, and whatever else you want to store at a single point of access in your app.
 * Only one copy of a given service exists per app.
 */
export function makeService(fn) {
  // Lifecycle hook callbacks
  const onBeforeConnect = [];
  const onAfterConnect = [];

  // Subscriptions for observables observed through subscribeTo
  const subscriptions = [];

  const service = {
    /**
     * Called by the App to initialize the service.
     */
    init({ appContext, name }) {
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

      const exports = fn(ctx);

      if (!isObject(exports)) {
        throw new TypeError(`A service must return an object. Got: ${exports}`);
      }

      return exports;
    },

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
