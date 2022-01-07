import { makeState } from "@woofjs/state";
import { isFunction, isNode } from "../_helpers/typeChecking";
import { makeRender } from "./dolla/makeRender";

export function makeElement(tag, attrs, ...children) {
  return {
    element: {
      tag,
      $attrs: makeState(attrs),
      children,
    },
  };
}

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
      const unwatch = $name.watch((current) => {
        $label.set(`component:${current}`);
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
        element: create(dolla, self),

        component: {
          get name() {
            return $name.get();
          },
          debug: {
            get label() {
              return $label.get();
            },
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
          beforeConnect() {
            for (const callback of onBeforeConnect) {
              callback(options);
            }
          },
          connected() {
            for (const callback of onConnected) {
              callback(options);
            }
          },
          beforeDisconnect() {
            for (const callback of onBeforeDisconnect) {
              callback(options);
            }
          },
          disconnected() {
            for (const callback of onDisconnected) {
              callback(options);
            }

            for (const unwatch of watchers) {
              unwatch();
            }
            watchers = [];
          },
        },
      };
    },
  };
}
