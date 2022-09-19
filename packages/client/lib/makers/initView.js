import { isTemplate, isDOM, isFunction, isView, isString, isBinding } from "../helpers/typeChecking.js";
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

export function initView(fn, config) {
  let { appContext, elementContext, attrs, children, channelPrefix } = config;

  attrs = attrs || {};
  children = children || [];
  channelPrefix = channelPrefix || "view";

  const beforeConnectCallbacks = [];
  const afterConnectCallbacks = [];
  const beforeDisconnectCallbacks = [];
  const afterDisconnectCallbacks = [];

  // Track currently active subscriptions.
  // All observers are unsubscribed when the component is disconnected.
  let subscriptions = [];
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

  if (children) {
    initialState.push(["children", children]);
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

    /**
     * Creates a function that takes a new value when called with one.
     * Returns the last value it was called with when called without a value.
     *
     * Used for getting quick references to HTML elements or other values in custom views.
     */
    ref(initialValue) {
      let currentValue = initialValue;

      return function (newValue) {
        if (newValue === undefined) {
          return currentValue;
        }

        currentValue = newValue;
      };
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

    beforeConnect(callback) {
      beforeConnectCallbacks.push(callback);
    },
    afterConnect(callback) {
      afterConnectCallbacks.push(callback);
    },
    beforeDisconnect(callback) {
      beforeDisconnectCallbacks.push(callback);
    },
    afterDisconnect(callback) {
      afterDisconnectCallbacks.push(callback);
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
        afterConnectCallbacks.push(() => {
          subscriptions.push(observer.start());
        });
      }
    },
  };

  // Add debug methods.
  Object.defineProperties(ctx, Object.getOwnPropertyDescriptors(debug));
  Object.defineProperties(ctx, {
    name: {
      get() {
        return debug.name;
      },
      set(value) {
        debug.name = `${channelPrefix}:${value}`;
      },
    },
  });

  /*=============================*\
  ||     Watch dynamic attrs     ||
  \*=============================*/

  // Update state when bound values change.
  for (const key in bindings) {
    ctx.observe(bindings[key], (value) => {
      setBoundValue(key, value);
    });
  }

  /*=============================*\
  ||      Run setup function     ||
  \*=============================*/

  let element = fn(ctx);

  if (isTemplate(element)) {
    element = element.init({ appContext, elementContext });
  } else {
    if (element !== null && !isDOM(element)) {
      const message = `Components must return an h() element, a DOM node or null. Got: ${element}`;

      throw new TypeError(message);
    }
  }

  /*=============================*\
  ||     Define view object      ||
  \*=============================*/

  // This is the object the framework will use to control the view.
  const view = {
    state,

    /**
     * Returns the view's root DOM node, or null if there is none.
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

    setChildren(children) {
      setBoundValue("children", children);
    },

    /**
     * Connects this view to the DOM, running lifecycle hooks if it wasn't already connected.
     * Calling this on a view that is already connected can reorder it or move it to a different
     * place in the DOM without retriggering lifecycle hooks.
     *
     * @param parent - DOM node under which this view should be connected as a child.
     * @param after - A child node under `parent` after which this view should be connected.
     */
    connect(parent, after = null) {
      const wasConnected = view.isConnected;

      if (!wasConnected) {
        for (const callback of beforeConnectCallbacks) {
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
        for (const callback of afterConnectCallbacks) {
          callback();
        }
      }
    },

    /**
     * Disconnects this view from the DOM and runs lifecycle hooks.
     */
    disconnect() {
      if (view.isConnected) {
        for (const callback of beforeDisconnectCallbacks) {
          callback();
        }

        if (isView(element)) {
          element.disconnect();
        } else if (isDOM(element)) {
          element.parentNode?.removeChild(element);
        }

        isConnected = false;

        for (const callback of afterDisconnectCallbacks) {
          callback();
        }

        for (const subscription of subscriptions) {
          subscription.unsubscribe();
        }
        subscriptions = [];
      }
    },
  };

  Object.defineProperty(view, "isView", {
    value: true,
    writable: false,
    enumerable: true,
    configurable: false,
  });

  return view;
}
