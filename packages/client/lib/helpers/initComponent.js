import {
  isTemplate,
  isDOM,
  isFunction,
  isComponent,
  isObservable,
  isState,
  isString,
  isArrayOf,
} from "./typeChecking.js";
import { makeState } from "../state/makeState.js";

import { $$appContext, $$elementContext } from "../keys.js";

/**
 * Initializes a component function into a component instance that the framework can work with.
 *
 * @param componentFn - The component function.
 * @param config - Config object
 *
 * @param config.appContext - App resources such as getService()
 * @param config.attrs - Attributes passed to the function.
 * @param config.children - Children passed to the function.
 * @param config.elementContext - Context information for the creation of elements.
 */
export function initComponent(componentFn, config) {
  let { attrs, children, appContext, elementContext } = config;

  attrs = attrs || {};
  children = children || [];

  // Lifecycle hook callbacks
  let onBeforeConnect = [];
  let onAfterConnect = [];
  let onBeforeDisconnect = [];
  let onAfterDisconnect = [];

  // Track currently active subscriptions.
  // All observers are unsubscribed when the component is disconnected.
  let subscriptions = [];

  let transitionOutCallback;
  let routePreload;
  let isConnected = false;

  /*=============================*\
  ||         Parse attrs         ||
  \*=============================*/

  // Attributes are separated into those that change and those that don't.
  const staticAttrs = [];
  const observableAttrs = [];

  for (const name in attrs) {
    if (name.startsWith("$")) {
      if (isState(attrs[name])) {
        // Pass states through as-is when named with $.
        // Allows subcomponents to directly modify states through an explicit naming convention.
        staticAttrs.push({
          name,
          value: attrs[name],
        });
      } else {
        throw new TypeError(`Attributes beginning with $ must be states. Got: ${typeof attrs[name]}`);
      }
    } else if (isObservable(attrs[name])) {
      observableAttrs.push({
        name,
        value: attrs[name],
      });
    } else {
      staticAttrs.push({
        name,
        value: attrs[name],
      });
    }
  }

  /*=============================*\
  ||    Set up initial $attrs    ||
  \*=============================*/

  const initialAttrs = {};

  staticAttrs.forEach(({ name, value }) => {
    initialAttrs[name] = value;
  });

  observableAttrs.forEach(({ name, value }) => {
    if (isState(value)) {
      initialAttrs[name] = value.get();
    }
  });

  const $attrs = makeState(initialAttrs);

  /*=============================*\
  ||    Define context object    ||
  \*=============================*/

  const debug = appContext.debug.makeChannel(`component:${componentFn.name || "anonymous"}`);

  // This is the object the setup function uses to interface with the component.
  const ctx = {
    [$$appContext]: appContext,
    [$$elementContext]: elementContext,

    $attrs: $attrs.map(), // Read-only from inside the component.
    debug,
    children,

    /**
     * If `name` is a string, returns the service registered under that name.
     * If `name` is an array of strings, returns an array of services registered under those names.
     *
     * TODO: Register on appContext which components and services are using which services.
     */
    getService(name) {
      if (isString(name)) {
        if (appContext.services[name]) {
          return appContext.services[name];
        }
        throw new Error(`Service '${name}' is not registered on this app.`);
      } else if (isArrayOf(isString, name)) {
        return name.map(ctx.getService);
      } else {
        throw new TypeError(`Expected a service name or array of service names.`);
      }
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
    /**
     * Subscribes to an observable and handles unsubscription when the component is disconnected.
     */
    subscribeTo(observable, ...args) {
      if (isConnected) {
        // If called when the component is connected, we assume this code is in a lifecycle hook
        // where it will be retriggered at some point again after the component is reconnected.
        subscriptions.push(observable.subscribe(...args));
      } else {
        // This should only happen if called in the body of the component.
        // This code is not always re-run between when a component is disconnected and reconnected.
        onAfterConnect.push(() => {
          subscriptions.push(observable.subscribe(...args));
        });
      }
    },
  };

  /*=============================*\
  ||     Watch dynamic attrs     ||
  \*=============================*/

  // Update $attrs when state attrs change.
  observableAttrs.forEach(({ name, value }) => {
    ctx.subscribeTo(value, (next) => {
      $attrs.set((attrs) => {
        attrs[name] = next;
      });
    });
  });

  /*=============================*\
  ||      Run setup function     ||
  \*=============================*/

  let element = componentFn(ctx);

  if (isTemplate(element)) {
    element = element.init({ appContext, elementContext });
  } else {
    if (element !== null && !isDOM(element)) {
      let message = `Components must return an h() element, a DOM node or null. Got: ${element}`;

      throw new TypeError(message);
    }
  }

  /*=============================*\
  ||   Define component object   ||
  \*=============================*/

  // This is the object the framework will use to control the component.
  const component = {
    $attrs,

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

      return new Promise(async (resolve, reject) => {
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
          await result;
          done();
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
            throw new TypeError(`transitionOut callback must return a promise.`);
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
