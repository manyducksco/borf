import { isState, mergeStates } from "@woofjs/state";
import { isComponentInstance, isDOM, isFunction } from "./helpers/typeChecking.js";

/**
 * Defines a reusable component.
 *
 * @param fn - Function that defines the component.
 */
export function makeComponent(fn) {
  function create({ getService, $route, dolla, attrs, children }) {
    let onBeforeConnect = [];
    let onConnected = [];
    let onBeforeDisconnect = [];
    let onDisconnected = [];
    let watchers = [];
    let routePreload;
    let key;

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
          stateAttrs.push(
            attrs[name].map((value) => {
              return {
                name,
                value,
              };
            })
          );
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

    const $attrs = mergeStates($route, ...stateAttrs, (route, ...attrs) => {
      const merged = {
        "@route": route,
      };

      for (const attr of attrs) {
        merged[attr.name] = attr.value;
      }

      for (const attr of staticAttrs) {
        merged[attr.name] = attr.value;
      }

      return merged;
    });

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
      get(...selectors) {
        return $attrs.get(...selectors);
      },
      map(...selectors) {
        return $attrs.map(...selectors);
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
      watchState($state, callback, options = {}) {
        // onBeforeConnect.push(() => {
        //   watchers.push($state.watch(callback, { immediate: true }));
        // });

        watchers.push($state.watch(callback, options));
      },
    };

    const node = fn(dolla, self);

    if (node && !isComponentInstance(node) && !isDOM(node)) {
      let message = `Component must return an element or null. Got: ${node}`;

      throw new TypeError(message);
    }

    return {
      isComponentInstance: true,

      $attrs,

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
