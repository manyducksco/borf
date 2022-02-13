import { isState, makeState } from "@woofjs/state";
import { isComponentInstance, isDOM, isFunction } from "./helpers/typeChecking.js";

export function makeComponent(fn) {
  function create({ getService, $route, dolla, attrs, children }) {
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
      debug: getService("@debug").makeChannel("~"),
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

    const node = fn(dolla, self);

    if (node && !isComponentInstance(node) && !isDOM(node)) {
      let message = `Element function must return an element or null. Got: ${node}`;

      throw new TypeError(message);
    }

    return {
      get isComponentInstance() {
        return true;
      },

      get element() {
        if (node) {
          if (isComponentInstance(node)) {
            return node.element;
          }

          if (isDOM(node)) {
            return node;
          }
        }

        return null;
      },

      get isConnected() {
        if (node) {
          if (isComponentInstance(node)) {
            return node.isConnected;
          }

          if (isDOM(node)) {
            return node.parentNode != null;
          }
        }

        return false;
      },

      async _preload(mount) {
        if (!isFunction(preload)) return;

        return new Promise(async (resolve) => {
          const show = (node) => {
            if (!isComponentInstance(node)) {
              throw new TypeError(`Expected an element to display while preloading. Got: ${node}`);
            }

            mount(node);
          };

          const done = () => {
            resolve();
          };

          const result = preload(show, done);

          if (result && isFunction(result.then)) {
            await result;
            done();
          }
        });
      },

      async connect(parent, after = null) {
        const wasConnected = this.isConnected;

        if (!wasConnected) {
          let temp;

          // Run preload hook
          await this._preload(async (component) => {
            if (temp) {
              await temp.disconnect();
            }

            temp = component;
            await component.connect(parent, after);
          });

          // Run onBeforeConnect hook
          for (const callback of onBeforeConnect) {
            callback();
          }

          // Remove lingering temp elements from preload
          if (temp) {
            await temp.disconnect();
          }
        }

        if (isComponentInstance(node)) {
          await node.connect(parent, after);
        } else if (isDOM(node)) {
          parent.insertBefore(node, after ? after.nextSibling : null);
        }

        if (!wasConnected) {
          // Run connected hook
          for (const callback of onConnected) {
            callback();
          }
        }
      },

      async disconnect() {
        if (this.isConnected) {
          // Run beforeDisconnect hook
          for (const callback of onBeforeDisconnect) {
            callback();
          }

          if (isComponentInstance(node)) {
            await node.disconnect();
          } else if (isDOM(node)) {
            node.parentNode.removeChild(node);
          }

          // Run disconnected hook
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
  }

  create.isComponentFactory = true;

  return create;
}
