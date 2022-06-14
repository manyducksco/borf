import { isObject } from "./typeChecking.js";

export function initService(app, fn, debug, options = {}) {
  const { getService } = app;

  // Lifecycle hook callbacks
  let onBeforeConnect = [];
  let onAfterConnect = [];

  // Cancel functions for state watchers that are currently active.
  let activeWatchers = [];

  const self = {
    debug,
    options,
    getService,
    beforeConnect(callback) {
      onBeforeConnect.push(callback);
    },
    afterConnect(callback) {
      onAfterConnect.push(callback);
    },
    watchState($state, ...args) {
      activeWatchers.push($state.watch(...args));
    },
  };

  const exports = fn.call(self, self);

  if (!isObject(exports)) {
    throw new TypeError(`A service must return an object. Got: ${exports}`);
  }

  const service = {
    exports,
    beforeConnect() {
      for (const callback of onBeforeConnect) {
        callback();
      }
    },
    afterConnect() {
      for (const callback of onAfterConnect) {
        callback();
      }
    },
  };

  Object.defineProperty(service, "isService", {
    value: true,
    writable: false,
  });

  return service;
}
