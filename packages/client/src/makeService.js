import { isObject } from "./helpers/typeChecking.js";

export function makeService(fn) {
  function Service({ getService, debugChannel, options = {} }) {
    let onBeforeConnect = [];
    let onAfterConnect = [];
    let watchers = [];

    const self = {
      debug: debugChannel,
      options,
      getService,
      beforeConnect(callback) {
        onBeforeConnect.push(callback);
      },
      afterConnect(callback) {
        onAfterConnect.push(callback);
      },
      watchState($state, ...args) {
        watchers.push($state.watch(...args));
      },
    };

    const exports = fn(self);

    if (!isObject(exports)) {
      throw new TypeError(`A service must return an object. Got: ${exports}`);
    }

    return {
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
  }

  Object.defineProperty(Service, "isService", {
    value: true,
    writable: false,
  });

  return Service;
}
