import { isObject } from "./helpers/typeChecking.js";
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

  return {
    exports: null,

    /**
     * Called by the App to initialize the service.
     */
    init({ appContext, name }) {
      const debugChannel = appContext.debug.makeChannel(`woof:serviceInit:${name}`);

      const ctx = {
        [$$appContext]: appContext,

        debug: appContext.debug.makeChannel(`service:${name}`),
        services: appContext.services,
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

      this.exports = fn.call(ctx, ctx);

      if (onBeforeConnect.length > 0) {
        debugChannel.log(
          `registered ${onBeforeConnect.length} beforeConnect callback${onBeforeConnect.length === 1 ? "" : "s"}`
        );
      }

      if (onAfterConnect.length > 0) {
        debugChannel.log(
          `registered ${onAfterConnect.length} afterConnect callback${onAfterConnect.length === 1 ? "" : "s"}`
        );
      }

      if (subscriptions.length > 0) {
        debugChannel.log(`subscribed to ${subscriptions.length} observable${subscriptions.length === 1 ? "" : "s"}`);
      }

      debugChannel.log("exports", this.exports);

      if (!isObject(this.exports)) {
        throw new TypeError(`A service must return an object. Got: ${this.exports}`);
      }

      return this;
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

    get isService() {
      return true;
    },
  };
}
