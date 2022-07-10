import { isObject } from "./typeChecking.js";

import { makeState } from "../state/makeState.js";
import { mergeStates } from "../state/mergeStates.js";
import { proxyState } from "../state/proxyState.js";

const serviceHelpers = {
  makeState,
  mergeStates,
  proxyState,
};

export function initService(appContext, fn, debug, config) {
  // Lifecycle hook callbacks
  let onBeforeConnect = [];
  let onAfterConnect = [];

  // Cancel functions for state watchers that are currently active.
  let activeWatchers = [];

  const ctx = {
    debug,
    options: config.options || {},
    services: appContext.services,
    helpers: serviceHelpers,

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

  const exports = fn.call(ctx, ctx);

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
