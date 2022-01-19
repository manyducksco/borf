{
  /* import { isObject } from "../_helpers/typeChecking"; */
}

export function makeService(create) {
  return {
    get isService() {
      return true;
    },

    create({ getService, debug, options = {} }) {
      let onBeforeConnect = [];
      let onConnected = [];
      let watchers = [];

      const self = {
        debug,
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

      const exports = create(self);

      if (!isObject(exports)) {
        throw new TypeError(`Service must return an object. Got: ${exports}`);
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
    },
  };
}
