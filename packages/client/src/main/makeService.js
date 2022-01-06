import { makeState } from "@woofjs/state";

/**
 * @param create - constructor function
 */
export function makeService(create) {
  return {
    get isService() {
      return true;
    },

    create(getService) {
      let onCreated = [];
      let onConnected = [];
      let watchers = [];

      const $name = makeState();
      const $label = makeState("service:~");

      // Update label from service name unless it has been explicitly set.
      const unwatch = $name.watch((current) => {
        $label.set(`service:${current}`);
      });

      const self = {
        get name() {
          return $name.get();
        },
        set name(value) {
          $name.set(value);
        },
        debug: {
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
        created(callback) {
          onCreated.push(callback);
        },
        connected(callback) {
          onConnected.push(callback);
        },
        watchState($state, ...args) {
          watchers.push($state.watch(...args));
        },
        getService,
      };

      return {
        exports: create(self),
        _created(options = {}) {
          for (const callback of onCreated) {
            callback(options);
          }
        },
        _connected() {
          for (const callback of onConnected) {
            callback();
          }
        },
      };
    },
  };
}
