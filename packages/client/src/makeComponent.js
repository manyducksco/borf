import { isState, makeState } from "@woofjs/state";
import { isComponentInstance, isDOM, isFunction } from "./helpers/typeChecking.js";

/**
 * Defines a reusable component.
 *
 * @param fn - Function that defines the component.
 */
export function makeComponent(fn) {
  function Component({ getService, $route, dolla, attrs, children }) {
    let onBeforeConnect = [];
    let onAfterConnect = [];
    let onBeforeDisconnect = [];
    let onAfterDisconnect = [];
    let watchers = [];
    let routePreload;
    let key;
    let isConnected = false;

    const staticAttrs = [];
    const stateAttrs = [];

    for (const name in attrs) {
      if (isState(attrs[name])) {
        if (name.startsWith("$")) {
          // Pass states through as-is when named with $
          staticAttrs.push({
            name,
            value: attrs[name],
          });
        } else {
          stateAttrs.push({
            name,
            value: attrs[name],
          });
        }
      } else {
        if (name.startsWith("$")) {
          throw new TypeError(`Attributes beginning with $ must be states. Got: ${typeof attrs[name]}`);
        } else {
          staticAttrs.push({
            name,
            value: attrs[name],
          });
        }
      }
    }

    const initialAttrs = {};

    initialAttrs["@route"] = $route.get();

    stateAttrs.forEach(({ name, value }) => {
      initialAttrs[name] = value.get();
    });

    staticAttrs.forEach(({ name, value }) => {
      initialAttrs[name] = value;
    });

    const $attrs = makeState(initialAttrs);

    // Create self object to pass to component function.
    const self = {
      get(...selectors) {
        return $attrs.get(...selectors);
      },
      map(...selectors) {
        return $attrs.map(...selectors);
      },
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
      get isConnected() {
        return isConnected;
      },
      loadRoute(func) {
        routePreload = func;
      },
      beforeConnect(callback) {
        onBeforeConnect.push(callback);
      },
      afterConnect(callback) {
        onAfterConnect.push(callback);
      },
      beforeDisconnect(callback) {
        onBeforeDisconnect.push(callback);
      },
      afterDisconnect(callback) {
        onAfterDisconnect.push(callback);
      },
      watchState($state, callback, options = {}) {
        onAfterConnect.push(() => {
          watchers.push($state.watch(callback, options));
        });

        // Add to watchers immediately if already connected.
        if (isConnected) {
          watchers.push($state.watch(callback, options));
        }
      },
    };

    // Update $attrs when route changes.
    self.watchState($route, (value) => {
      $attrs.set((current) => {
        current["@route"] = value;
      });
    });

    // Update $attrs when state attrs change.
    stateAttrs.map(({ name, value }) => {
      self.watchState(value, (unwrapped) => {
        $attrs.set((attrs) => {
          attrs[name] = unwrapped;
        });
      });
    });

    // Call component function which should return a renderable node or null.
    const node = fn(dolla, self);

    if (node !== null && !isComponentInstance(node) && !isDOM(node)) {
      let message = `Component must return an element or null. Got: ${node}`;

      throw new TypeError(message);
    }

    const instance = {
      $attrs,

      get key() {
        return self.key;
      },

      set key(value) {
        self.key = value;
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
        const wasConnected = instance.isConnected;

        if (!wasConnected) {
          // Run beforeConnect hook
          for (const callback of onBeforeConnect) {
            callback();
          }
        }

        if (isComponentInstance(node)) {
          node.connect(parent, after);
        } else if (isDOM(node)) {
          parent.insertBefore(node, after ? after.nextSibling : null);
        }

        isConnected = true;

        if (!wasConnected) {
          // Run afterConnect hook
          for (const callback of onAfterConnect) {
            callback();
          }
        }
      },

      disconnect() {
        if (instance.isConnected) {
          // Run beforeDisconnect hook
          for (const callback of onBeforeDisconnect) {
            callback();
          }

          if (isComponentInstance(node)) {
            node.disconnect();
          } else if (isDOM(node)) {
            node.parentNode.removeChild(node);
          }

          isConnected = false;

          // Run afterDisconnect hook
          for (const callback of onAfterDisconnect) {
            callback();
          }

          for (const unwatch of watchers) {
            unwatch();
          }
          watchers = [];
        }

        isConnected = false;
      },
    };

    Object.defineProperty(instance, "isComponentInstance", {
      value: true,
      writable: false,
    });

    return instance;
  }

  Object.defineProperty(Component, "isComponent", {
    value: true,
    writable: false,
  });

  return Component;
}
