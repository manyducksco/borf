import { makeState } from "@woofjs/state";
import { isComponentInstance } from "../../app/src/helpers/typeChecking";
import { isFunction } from "../_helpers/typeChecking";
import { makeRender } from "./dolla/makeRender";

/**
 * @param create - constructor function
 */
export function makeComponent(create) {
  return {
    get isComponent() {
      return true;
    },

    create({ getService, debug, dolla, attrs, children, $route }) {
      let onBeforeConnect = [];
      let onConnected = [];
      let onBeforeDisconnect = [];
      let onDisconnected = [];
      let watchers = [];
      let preload;

      const self = {
        $route,
        $attrs: makeState({}),
        getService,
        children,
        debug,
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

      if (element !== null && !isComponentInstance(element)) {
        // console.log(String(create));
        throw new TypeError(`Component must return a component or null. Got: ${element}`);
      }

      return {
        get isComponentInstance() {
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

                if (isComponentInstance(tempNode)) {
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

          // Run connect even if already connected without rerunning lifecycle hooks.
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
