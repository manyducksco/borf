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

      // Update label based on service name.
      // Cancelled if debug.label is set explicitly.
      const unwatchName = $name.watch((current) => {
        $label.set(`component:${current}`);
      });

      const self = {
        getService,
        $route,
        $attrs: makeState({}),
        children,
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
            unwatchName();
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
        preload(func) {
          preload = func;
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
        watchState($state, ...args) {
          watchers.push($state.watch(...args));
        },
      };

      self.$attrs.set((current) => {
        for (const key in attrs) {
          current[key] = attrs[key];
        }
      });

      const element = create(dolla, self);

      return {
        get isNode() {
          return true;
        },

        element: create(dolla, self),

        connect(parent, after = null) {
          const wasConnected = this.element.isConnected;

          // Run lifecycle callback only if connecting.
          // Connecting a node that is already connected moves it without unmounting.
          if (!wasConnected) {
            if (!isNode(this.element)) {
              throw new Error(`Component function must return an $(element). Received: ${this.element}`);
            }

            for (const callback of onBeforeConnect) {
              callback();
            }
          }

          this.element.connect(parent, after);

          if (!wasConnected) {
            for (const callback of onConnected) {
              callback();
            }
          }
        },

        disconnect() {
          if (this.isConnected) {
            for (const callback of onBeforeDisconnect) {
              callback();
            }

            this.element.disconnect();

            for (const callback of onDisconnected) {
              callback();
            }

            for (const unwatch of watchers) {
              unwatch();
            }
            watchers = [];
          }
        },

        async preload(mount) {
          return new Promise((resolve) => {
            if (isFunction(preload)) {
              const done = () => {
                resolve();
              };

              const tempElement = preload(done);

              if (tempElement) {
                const render = makeRender(tempElement);
                const tempNode = render();

                self.debug.log(tempNode);

                if (isNode(tempNode)) {
                  mount(tempNode);
                } else {
                  throw new Error(`Expected preload function to return a node or undefined. Received: ${tempNode}`);
                }
              }
            } else {
              resolve();
            }
          });
        },
      };
    },
  };
}
