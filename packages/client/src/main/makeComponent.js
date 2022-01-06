import { makeState } from "@woofjs/state";
import { isFunction, isNode } from "../_helpers/typeChecking";
import { makeRender } from "./dolla/makeRender";

/**
 * @param create - constructor function
 */
export function makeComponent(create) {
  return {
    get isComponent() {
      return true;
    },

    create(getService, dolla, attrs, children, $route) {
      let onBeforeConnect = [];
      let onConnected = [];
      let onBeforeDisconnect = [];
      let onDisconnected = [];
      let watchers = [];
      let preload;

      const $name = makeState();
      const $label = makeState("component:~");

      // Update label from service name unless it has been explicitly set.
      const unwatch = $name.watch((current) => {
        $label.set(`component:${current}`);
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
        beforeConnect(callback) {
          onBeforeConnect.push(callback);
        },
        connected(callback) {
          onConnected.push(callback);
        },
        beforeDisconnect(callback) {
          onBeforeDisconnect.push(callback);
        },
        disconnected(callback) {
          onDisconnected.push(callback);
        },
        getService,
        preload(func) {
          preload = func;
        },
        watchState($state, ...args) {
          watchers.push($state.watch(...args));
        },
        $route,
        $attrs: makeState({}),
        children,
      };

      self.$attrs.set((current) => {
        for (const key in attrs) {
          current[key] = attrs[key];
        }
      });

      return {
        element: makeRender(create(dolla, self))(),

        // TODO: Figure out renderers - need to pass this object to a renderer to render the component
        // Dolla probably needs to work with some kind of abstract node object instead of real elements.

        async load(mount) {
          return new Promise((resolve) => {
            if (isFunction(preload)) {
              const done = () => {
                self.debug.log(this.element);
                mount(this.element);
                resolve();
              };

              const element = preload(done);

              if (element) {
                const render = makeRender(element);
                const tempNode = render();

                if (isNode(tempNode)) {
                  mount(tempNode);
                } else {
                  throw new Error(
                    `Expected preload function to return a node to render, or return undefined. Received: ${tempNode}`
                  );
                }
              }
            } else {
              resolve();
            }
          });
        },

        _beforeConnect() {
          for (const callback of onBeforeConnect) {
            callback(options);
          }
        },
        _connected() {
          for (const callback of onConnected) {
            callback(options);
          }
        },
        _beforeDisconnect() {
          for (const callback of onBeforeDisconnect) {
            callback(options);
          }
        },
        _disconnected() {
          for (const callback of onDisconnected) {
            callback(options);
          }

          for (const unwatch of watchers) {
            unwatch();
          }
          watchers = [];
        },
      };
    },
  };
}
