import { isTemplate, isDOM, isFunction, isComponent, isObservable, isState } from "./typeChecking.js";

import { h, when, unless, watch, repeat, bind } from "../h.js";
import { makeState } from "../state/makeState.js";
import { mergeStates } from "../state/mergeStates.js";
import { makeProxyState } from "../state/makeProxyState.js";

export const appContextKey = Symbol("appContext");
export const elementContextKey = Symbol("elementContext");

const componentHelpers = {
  h,
  when,
  unless,
  watch,
  repeat,
  bind,
  makeState,
  mergeStates,
  makeProxyState,
};

/**
 * Initializes a component function into a component instance that the framework can work with.
 *
 * @param appContext - App resources such as getService()
 * @param fn - The component function.
 * @param attrs - Attributes passed to the function.
 * @param children - Children passed to the function.
 * @param elementContext - Context information for the creation of elements.
 */
export function initComponent(appContext, fn, attrs, children, elementContext) {
  attrs = attrs || {};
  children = children || [];

  // Lifecycle hook callbacks
  let onBeforeConnect = [];
  let onAfterConnect = [];
  let onBeforeDisconnect = [];
  let onAfterDisconnect = [];

  // Cancel functions for state subscriptions that are currently active.
  // All active watchers are cancelled when the component is disconnected.
  let subscriptions = [];

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

  // This is the object the setup function uses to interface with the component.
  const ctx = {
    $attrs: $attrs.map(), // Read-only from inside the component.
    services: appContext.services,
    debug: appContext.debug.makeChannel(`component:${fn.name || "anonymous"}`),
    children,

    helpers: componentHelpers,

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
      throw new Error(`transitionOut is not yet implemented.`);
    },
    watchState($state, callback) {
      onAfterConnect.push(() => {
        subscriptions.push($state.subscribe({ next: callback }));
      });

      if (isConnected) {
        throw new Error(
          "Called watchState after component was already connected. This will cause memory leaks. This function should only be called in the body of the component."
        );
      }
    },
  };

  // Add the app context, but key it with a symbol so it can't be accessed outside of Woof's own internal components.
  Object.defineProperty(ctx, appContextKey, {
    value: appContext,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  // Stores data relevant to rendering, such as if the root element is in an SVG context.
  Object.defineProperty(ctx, elementContextKey, {
    value: elementContext,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  /*=============================*\
  ||     Watch dynamic attrs     ||
  \*=============================*/

  // Update $attrs when state attrs change.
  observableAttrs.forEach(({ name, value }) => {
    ctx.watchState(value, (unwrapped) => {
      $attrs.set((attrs) => {
        attrs[name] = unwrapped;
      });
    });
  });

  /*=============================*\
  ||      Run setup function     ||
  \*=============================*/

  let element = fn.call(ctx, ctx);

  if (isTemplate(element)) {
    element = element.init(appContext, elementContext);
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
            element = element.init(appContext, elementContext);
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
     */
    disconnect() {
      if (component.isConnected) {
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

      isConnected = false;
    },
  };

  Object.defineProperty(component, "isComponent", {
    value: true,
    writable: false,
  });

  return component;
}