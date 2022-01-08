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

      if (element !== null && !isNode(element)) {
        console.log(String(create));
        throw new TypeError(`Expected component to return an $(element) or null. Got: ${element}`);
      }

      return {
        get isNode() {
          return true;
        },

        element,

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

        connect(parent, after = null) {
          const wasConnected = element == null ? false : element.isConnected;

          if (!wasConnected) {
            for (const callback of onBeforeConnect) {
              callback();
            }
          }

          // Running connect even if already connected without rerunning lifecycle hooks.
          // This is used for reinserting nodes when sorting an $Each.
          if (element != null) this.element.connect(parent, after);

          if (!wasConnected) {
            for (const callback of onConnected) {
              callback();
            }
          }
        },

        disconnect() {
          if (element.isConnected) {
            for (const callback of onBeforeDisconnect) {
              callback();
            }

            element.disconnect();

            for (const callback of onDisconnected) {
              callback();
            }

            for (const unwatch of watchers) {
              unwatch();
            }
            watchers = [];
          }
        },
      };
    },
  };
}
