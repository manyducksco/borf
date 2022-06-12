import { isState, makeState } from "@woofjs/state";
import { isView, isDOM, isFunction } from "./helpers/typeChecking.js";

/**
 * Defines a reusable component.
 *
 * @param fn - Function that defines the component.
 */
export function makeComponent(fn) {
  function Component({ getService, attrs, children }) {
    // Lifecycle hook callbacks
    let onBeforeConnect = [];
    let onAfterConnect = [];
    let onBeforeDisconnect = [];
    let onAfterDisconnect = [];

    // Cancel functions for state watchers that are currently active.
    // All active watchers are cancelled when the component is disconnected.
    let activeWatchers = [];

    let routePreload;
    let key;
    let isConnected = false;

    /*=============================*\
    ||         Parse attrs         ||
    \*=============================*/

    // Attributes are separated into those that don't change and those that do change through states.
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

    /*=============================*\
    ||    Set up initial $attrs    ||
    \*=============================*/

    const initialAttrs = {};

    stateAttrs.forEach(({ name, value }) => {
      initialAttrs[name] = value.get();
    });

    staticAttrs.forEach(({ name, value }) => {
      initialAttrs[name] = value;
    });

    const $attrs = makeState(initialAttrs);

    /*=============================*\
    ||     Define self object      ||
    \*=============================*/

    // This is the object the setup function uses to interface with the component.
    const self = {
      getService,

      children,
      debug: getService("@debug").makeChannel("~"),

      // TODO: Can we figure out how to diff lists without using keys?
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
          activeWatchers.push($state.watch(callback, options));
        });

        // Add to watchers immediately if already connected.
        if (isConnected) {
          activeWatchers.push($state.watch(callback, options));
        }
      },
    };

    /*=============================*\
    ||     Watch dynamic attrs     ||
    \*=============================*/

    // Update $attrs when state attrs change.
    stateAttrs.map(({ name, value }) => {
      self.watchState(value, (unwrapped) => {
        $attrs.set((attrs) => {
          attrs[name] = unwrapped;
        });
      });
    });

    /*=============================*\
    ||      Run setup function     ||
    \*=============================*/

    const element = fn.call(self, $attrs, self);

    if (isView(element)) {
      element.init({ getService });
    } else {
      if (element !== null && !isDOM(element)) {
        let message = `Components must return a view, a DOM node or null. Got: ${element}`;

        throw new TypeError(message);
      }
    }

    /*=============================*\
    ||   Define component object   ||
    \*=============================*/

    // This is the object the framework will use to control the component.
    const instance = {
      $attrs,

      /**
       * Returns this component's unique identifier. Used to ID the component when used in `$.each`.
       */
      get key() {
        return self.key;
      },

      /**
       * Sets this component's unique identifier. Used to ID the component when used in `$.each`.
       *
       * @param value - A state or a plain value of any type
       */
      set key(value) {
        self.key = value;
      },

      /**
       * Returns the component's root DOM node, or null if there is none.
       */
      get node() {
        if (element) {
          if (isView(element)) {
            return element.node;
          }

          if (isDOM(element)) {
            return element;
          }
        }

        return null;
      },

      /**
       * True if the root DOM node is currently in the document.
       */
      get isConnected() {
        return isConnected;
      },

      /**
       * True if the component defines a preload function with `self.preloadRoute(fn)`.
       */
      get hasRoutePreload() {
        // return isFunction(routePreload);
        return false; // Temporarily disabled for refactoring
      },

      /**
       * Perform preload with route's preload function. Called only when this component is mounted on a route.
       *
       * @param mount - Function that takes a component instance and connects it to the DOM.
       */
      // async routePreload(mount) {
      //   if (!isFunction(routePreload)) return;

      //   return new Promise(async (resolve) => {
      //     const show = (node) => {
      //       if (!isComponentInstance(node)) {
      //         throw new TypeError(`Expected an element to display while preloading. Got: ${node}`);
      //       }

      //       mount(node);
      //     };

      //     const done = () => {
      //       resolve();
      //     };

      //     const result = routePreload({ show, done });

      //     if (result && isFunction(result.then)) {
      //       await result;
      //       done();
      //     }
      //   });
      // },

      /**
       * Connects this component to the DOM, running lifecycle hooks if it wasn't already connected.
       * Calling this on a component that is already connected can reorder it or move it to a different
       * place in the DOM without triggering lifecycle hooks again.
       *
       * @param parent - DOM node under which this component should be connected as a child.
       * @param after - A child node under `parent` after which this component should be connected.
       */
      connect(parent, after = null) {
        const wasConnected = instance.isConnected;

        if (!wasConnected) {
          // Run beforeConnect hook
          for (const callback of onBeforeConnect) {
            callback();
          }
        }

        if (isView(element)) {
          element.connect(parent, after);
        } else if (isDOM(element)) {
          parent.insertBefore(element, after ? after.nextSibling : null);
        }

        isConnected = true;

        if (!wasConnected) {
          // Run afterConnect hook
          for (const callback of onAfterConnect) {
            callback();
          }
        }
      },

      /**
       * Disconnects this component from the DOM and runs lifecycle hooks.
       */
      disconnect() {
        if (instance.isConnected) {
          // Run beforeDisconnect hook
          for (const callback of onBeforeDisconnect) {
            callback();
          }

          if (isView(element)) {
            element.disconnect();
          } else if (isDOM(element)) {
            element.parentNode.removeChild(element);
          }

          isConnected = false;

          // Run afterDisconnect hook
          for (const callback of onAfterDisconnect) {
            callback();
          }

          for (const unwatch of activeWatchers) {
            unwatch();
          }
          activeWatchers = [];
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
