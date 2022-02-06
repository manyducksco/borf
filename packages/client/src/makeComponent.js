import { isState, makeState } from "@woofjs/state";
import { isDolla, isFunction, isNode } from "./helpers/typeChecking.js";
import { makeRenderable } from "./dolla/makeRenderable.js";

export function makeComponent(create) {
  return {
    get isComponent() {
      return true;
    },

    create({ getService, debugChannel, dolla, attrs, children, $route }) {
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
        debug: debugChannel,
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

      const parsedAttrs = {};

      for (const key in attrs) {
        // Attrs beginning in $ are expected to be states. They will be passed through untouched.
        // State attrs not beginning with $ will be unwrapped and passed as their current value.
        // This echoes how elements handle states.
        if (key[0] === "$") {
          if (isState(attrs[key])) {
            parsedAttrs[key] = attrs[key]; // Pass states through as states when named appropriately
          } else {
            throw new TypeError(`An attribute beginning with $ must be a state. Got: ${attrs[key]} (key: ${key})`);
          }
        } else {
          if (isState(attrs[key])) {
            // TODO: Ensure component is not disconnected and reconnected without reconstruction or these will not be reapplied.
            // If they go in .connect() then they'll trigger watchers added in the body of `create`, which they shouldn't.
            watchers.push(
              attrs[key].watch((value) => {
                self.$attrs.set((current) => {
                  current[key] = value;
                });
              })
            );

            parsedAttrs[key] = attrs[key].get();
          } else {
            parsedAttrs[key] = attrs[key];
          }
        }
      }

      self.$attrs.set(parsedAttrs);

      let element = create(dolla, self);

      if (element !== null) {
        if (isDolla(element)) {
          element = element();
        }

        if (!isNode(element)) {
          console.log(String(create));
          let message = `Component must return an $(element) or null. Got: ${element}`;

          self.debug.error(message);
          throw new TypeError(message);
        }
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
                const render = makeRenderable(tempElement);
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
          if (element?.isConnected) {
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
