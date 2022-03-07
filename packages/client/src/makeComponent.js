import { isState, makeState } from "@woofjs/state";
import { isComponentInstance, isDOM, isFunction } from "./helpers/typeChecking.js";

export function makeComponent(fn) {
  function create({ getService, $route, dolla, attrs, children }) {
    let onBeforeConnect = [];
    let onConnected = [];
    let onBeforeDisconnect = [];
    let onDisconnected = [];
    let watchers = [];
    let routePreload;
    let key;

    const $attrs = makeState({});

    const self = {
      $route,
      $attrs,
      getService,
      children,
      debug: getService("@debug").makeChannel("~"),
      get key() {
        if (isState(key)) {
          return key.get();
        } else {
          return key;
        }
      },
      set key(value) {
        key = value;
      },
      loadRoute(func) {
        routePreload = func;
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
      // Attributes starting with $ should be states and will be passed through as-is.
      // States passed to attributes not starting with $ will be unwrapped and passed as their current value.
      if (key[0] === "$") {
        if (isState(attrs[key])) {
          parsedAttrs[key] = attrs[key]; // Pass states through as states when named appropriately
        } else {
          throw new TypeError(`An attribute beginning with $ must be a state. Got: ${attrs[key]} (key: ${key})`);
        }
      } else {
        if (isState(attrs[key])) {
          // TODO: Ensure component is not disconnected and reconnected without reconstruction or these will not be reapplied.
          //       If they go in .connect() then they'll trigger watchers added in the body of `fn`, which they shouldn't.
          watchers.push(
            attrs[key].watch((value) => {
              $attrs.set((current) => {
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

    $attrs.set(parsedAttrs);

    const node = fn(dolla, self);

    if (node && !isComponentInstance(node) && !isDOM(node)) {
      let message = `Component must return an element or null. Got: ${node}`;

      throw new TypeError(message);
    }

    return {
      isComponentInstance: true,

      $attrs,
      $route,

      get key() {
        return key;
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

      get hasRoutePreload() {
        return isFunction(routePreload);
      },

      async routePreload(mount) {
        if (!isFunction(routePreload)) return;

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

          const result = routePreload(show, done);

          if (result && isFunction(result.then)) {
            await result;
            done();
          }
        });
      },

      connect(parent, after = null) {
        const wasConnected = this.isConnected;

        if (!wasConnected) {
          // Run onBeforeConnect hook
          for (const callback of onBeforeConnect) {
            callback();
          }
        }

        if (isComponentInstance(node)) {
          node.connect(parent, after);
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

      disconnect() {
        if (this.isConnected) {
          // Run beforeDisconnect hook
          for (const callback of onBeforeDisconnect) {
            callback();
          }

          if (isComponentInstance(node)) {
            node.disconnect();
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

  create.isComponent = true;

  return create;
}
