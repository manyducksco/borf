import { isTemplate, isDOM, isFunction, isComponent, isString, isBinding } from "../helpers/typeChecking.js";
import { APP_CONTEXT, ELEMENT_CONTEXT } from "../keys.js";

import { makeState } from "./makeState.js";
import { makeViewHelpers } from "./makeViewHelpers.js";

/**
 * State binding for views:
 *
 * - Values are passed as attributes
 * - defaultState is applied
 * - attribute values are applied
 * - bindings are configured;
 *   - readable bindings are observed
 *   - writable bindings are observed and state is observed to write values back
 */

export function makeView(fn, config) {
  let { attrs, children, appContext, elementContext, channelPrefix } = config;

  attrs = attrs || {};
  children = children || [];

  channelPrefix = channelPrefix || "view";

  // Lifecycle hook callbacks
  const onBeforeConnect = [];
  const onAfterConnect = [];
  const onBeforeDisconnect = [];
  const onAfterDisconnect = [];

  // Track currently active subscriptions.
  // All observers are unsubscribed when the component is disconnected.
  let subscriptions = [];

  let transitionOutCallback;
  let routePreload;
  let isConnected = false;

  /*=============================*\
  ||         Parse attrs         ||
  \*=============================*/

  const initialState = [];
  const bindings = {};

  for (const key in attrs) {
    if (isBinding(attrs[key])) {
      bindings[key] = attrs[key];
      initialState.push([key, attrs[key].get()]);
    } else {
      initialState.push([key, attrs[key]]);
    }
  }

  const debug = appContext.globals.debug.exports.channel(`${channelPrefix}:${fn.name || "unnamed"}`);
  const [state, setBoundValue] = makeState({ initialState, bindings, debug });
  const helpers = makeViewHelpers(state);

  /*=============================*\
  ||    Define context object    ||
  \*=============================*/

  // This is the object the setup function uses to interface with the component.
  const ctx = {
    [APP_CONTEXT]: appContext,
    [ELEMENT_CONTEXT]: elementContext,

    ...debug,
    ...state,
    ...helpers,

    set defaultState(values) {
      // Set defaults only if they haven't been set already.
      for (const key in values) {
        if (state.get(key) === undefined) {
          state.set(key, values[key]);
        }
      }
    },

    get name() {
      return debug.name;
    },
    set name(value) {
      debug.name = `${channelPrefix}:${value}`;
    },

    children,

    outlet() {
      // TODO: Rework this to use an actual Outlet view that renders children.
      return children;
    },

    /**
     * Returns the service registered under `name` or throws an error if it isn't registered.
     *
     * TODO: Register on appContext which globals and views are using which globals.
     */
    global(name) {
      if (!isString(name)) {
        throw new TypeError("Expected a string.");
      }

      if (appContext.globals[name]) {
        return appContext.globals[name].exports;
      }

      throw new Error(`Global '${name}' is not registered on this app.`);
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
    transitionOut(callback) {
      transitionOutCallback = callback;
    },

    observe(...args) {
      const observer = state.observe(...args);

      if (isConnected) {
        // If called when the view is connected, we assume this code is in a lifecycle hook
        // where it will be retriggered at some point again after the view is reconnected.
        subscriptions.push(observer.start());
      } else {
        // This should only happen if called in the body of the view.
        // This code is not always re-run between when a view is disconnected and reconnected.
        onAfterConnect.push(() => {
          subscriptions.push(observer.start());
        });
      }
    },
  };

  /*=============================*\
  ||     Watch dynamic attrs     ||
  \*=============================*/

  // Update state when bound values change.
  for (const key in bindings) {
    ctx.observe(bindings[key], (value) => {
      setBoundValue(key, value);
    });
  }

  /* =============================*\
  ||      Run setup function     ||
  \*============================= */

  let element = fn.call(ctx);

  if (isTemplate(element)) {
    element = element.init({ appContext, elementContext });
  } else {
    if (element !== null && !isDOM(element)) {
      const message = `Components must return an h() element, a DOM node or null. Got: ${element}`;

      throw new TypeError(message);
    }
  }

  /* =============================*\
  ||   Define component object   ||
  \*============================= */

  // This is the object the framework will use to control the component.
  const component = {
    state,

    /**
     * Returns the component's root DOM node, or null if there is none.
     */
    get node() {
      if (element) {
        if (isComponent(element)) {
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
      return isFunction(routePreload);
    },

    /**
     * Perform preload with route's preload function. Called only when this component is mounted on a route.
     *
     * @param mount - Function that takes a component instance and connects it to the DOM.
     */
    async routePreload(mount) {
      if (!isFunction(routePreload)) return;

      return new Promise((resolve, reject) => {
        const show = (element) => {
          if (isTemplate(element)) {
            element = element.init({ appContext, elementContext });
          } else {
            return reject(new TypeError(`Expected an element to display. Got: ${element} (${typeof element})`));
          }

          mount(element);
        };

        const done = () => {
          resolve();
        };

        const result = routePreload({ show, done });

        if (result && isFunction(result.then)) {
          result.then(() => done());
        }
      });
    },

    /**
     * Connects this component to the DOM, running lifecycle hooks if it wasn't already connected.
     * Calling this on a component that is already connected can reorder it or move it to a different
     * place in the DOM without retriggering lifecycle hooks.
     *
     * @param parent - DOM node under which this component should be connected as a child.
     * @param after - A child node under `parent` after which this component should be connected.
     */
    connect(parent, after = null) {
      const wasConnected = component.isConnected;

      if (!wasConnected) {
        for (const callback of onBeforeConnect) {
          callback();
        }
      }

      if (isComponent(element)) {
        element.connect(parent, after);
      } else if (isDOM(element)) {
        parent.insertBefore(element, after ? after.nextSibling : null);
      }

      isConnected = true;

      if (!wasConnected) {
        for (const callback of onAfterConnect) {
          callback();
        }
      }
    },

    /**
     * Disconnects this component from the DOM and runs lifecycle hooks.
     * The `allowTransitionOut` property should be `true` when this component is directly
     * being disconnected. It won't be passed on to children to avoid all transitions
     * triggering when a router changes. Only the top level component should animate out.
     */
    disconnect({ allowTransitionOut = false } = {}) {
      if (component.isConnected) {
        if (allowTransitionOut && transitionOutCallback) {
          const promise = transitionOutCallback();

          if (!(promise instanceof Promise)) {
            throw new TypeError("transitionOut callback must return a promise.");
          }

          for (const callback of onBeforeDisconnect) {
            callback();
          }

          promise.then(() => {
            if (isComponent(element)) {
              element.disconnect();
            } else if (isDOM(element)) {
              element.parentNode.removeChild(element);
            }

            isConnected = false;

            for (const callback of onAfterDisconnect) {
              callback();
            }

            for (const subscription of subscriptions) {
              subscription.unsubscribe();
            }
            subscriptions = [];
          });
        } else {
          for (const callback of onBeforeDisconnect) {
            callback();
          }

          if (isComponent(element)) {
            element.disconnect();
          } else if (isDOM(element)) {
            element.parentNode.removeChild(element);
          }

          isConnected = false;

          for (const callback of onAfterDisconnect) {
            callback();
          }

          for (const subscription of subscriptions) {
            subscription.unsubscribe();
          }
          subscriptions = [];
        }
      }
    },
  };

  Object.defineProperty(component, "isComponent", {
    value: true,
    writable: false,
    enumerable: true,
    configurable: false,
  });

  return component;
}
