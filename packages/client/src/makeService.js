import { isObject } from "./helpers/typeChecking.js";

export function makeService(fn) {
  function Service({ getService, debugChannel, options = {} }) {
    let onBeforeConnect = [];
    let onConnected = [];
    let watchers = [];

    const self = {
      debug: debugChannel,
      options,
      getService,
      beforeConnect(callback) {
        onBeforeConnect.push(callback);
      },
      connected(callback) {
        onConnected.push(callback);
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
      connected() {
        for (const callback of onConnected) {
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
