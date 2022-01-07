import { makeState } from "@woofjs/state";
import { isObject } from "../_helpers/typeChecking";

/**
 * @param create - constructor function
 */
export function makeService(create) {
  return {
    get isService() {
      return true;
    },

    create(getService, options = {}) {
      let onBeforeConnect = [];
      let onConnected = [];
      let watchers = [];

      const $name = makeState();
      const $label = makeState("service:~");

      // Update label from service name unless it has been explicitly set.
      const unwatch = $name.watch((current) => {
        $label.set(`service:${current}`);
      });

      const self = {
        debug: {
          get name() {
            return $name.get();
          },
          set name(value) {
            $name.set(value);
          },
          get label() {
            return $label.get();
          },
          set label(value) {
            unwatch();
            $label.set(value);
          },
          log(...args) {
            getService("@debug")
              .channel($label.get())
              .log(...args);
          },
          warn(...args) {
            getService("@debug")
              .channel($label.get())
              .warn(...args);
          },
          error(...args) {
            getService("@debug")
              .channel($label.get())
              .error(...args);
          },
        },
        beforeConnect(callback) {
          onBeforeConnect.push(callback);
        },
        connected(callback) {
          onConnected.push(callback);
        },
        watchState($state, ...args) {
          watchers.push($state.watch(...args));
        },
        getService,
        options,
      };

      const exports = create(self);

      if (!isObject(exports)) {
        throw new TypeError(`Service must return an object. Got: ${exports}`);
      }

      return {
        exports: create(self),
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
