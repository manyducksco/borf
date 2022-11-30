import { isDOM, isView, isString, isObservable, isArray, isFunction } from "../../helpers/typeChecking.js";
import { APP_CONTEXT, ELEMENT_CONTEXT } from "../../keys.js";
import { h } from "../h.js";

import { makeState, joinStates } from "../../helpers/state.js";

import { OutletBlueprint } from "../blueprints/Outlet.js";

export function initView(fn, config) {
  let { appContext, elementContext, attributes, children, channelPrefix, name } = config;

  attributes = Object.freeze(attributes ? { ...attributes } : {});
  channelPrefix = channelPrefix || "view";

  // Children can be changed at runtime when a view is mounted on a route with subroutes.
  // The outlet should update to reflect the latest children, hence the writable binding.
  const $$children = makeState(children || []);

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

  const channel = appContext.debug.makeChannel(`${channelPrefix}:${name || fn.viewName || fn.name || "<anonymous>"}`);

  /*=============================*\
  ||    Define context object    ||
  \*=============================*/

  // This is the object the setup function uses to interface with the component.
  const ctx = {
    [APP_CONTEXT]: appContext,
    [ELEMENT_CONTEXT]: elementContext,

    attrs: attributes,

    observe(...args) {
      let callback = args.pop();

      if (args.length === 0) {
        throw new TypeError(`Observe requires at least one observable.`);
      }

      const start = () => {
        if (isObservable(args.at(0))) {
          const $merged = joinStates(...args, callback);
          return $merged.subscribe(() => undefined);
        } else {
          const $merged = joinStates(...args, () => undefined);
          return $merged.subscribe(callback);
        }
      };

      if (isConnected) {
        // If called when the view is connected, we assume this code is in a lifecycle hook
        // where it will be triggered at some point again after the view is reconnected.
        subscriptions.push(start());
      } else {
        // This should only happen if called in the body of the view.
        // This code is not always re-run between when a view is disconnected and reconnected.
        afterConnectCallbacks.push(() => {
          subscriptions.push(start());
        });
      }
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

    /**
     * Renders nested elements passed to this view.
     */
    outlet() {
      return new OutletBlueprint($$children.readable());
    },
  };

  // Add debug methods.
  Object.defineProperties(ctx, Object.getOwnPropertyDescriptors(channel));
  Object.defineProperties(ctx, {
    name: {
      get() {
        return channel.name;
      },
      set(value) {
        channel.name = `${channelPrefix}:${value}`;
      },
    },
  });

  /*=============================*\
  ||      Run setup function     ||
  \*=============================*/

  let element;

  try {
    element = fn(ctx, h);
  } catch (err) {
    console.error(err);
  }

  if (element?.isBlueprint) {
    element = element.build({ appContext, elementContext });
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
      $$children.set(children);
    },

    /**
     * Connects this view to the DOM, running lifecycle hooks if it wasn't already connected.
     * Calling this on a view that is already connected can reorder it or move it to a different
     * place in the DOM without re-triggering lifecycle hooks.
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
        setTimeout(() => {
          for (const callback of afterConnectCallbacks) {
            callback();
          }
        }, 0);
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

        setTimeout(() => {
          for (const callback of afterDisconnectCallbacks) {
            callback();
          }

          for (const subscription of subscriptions) {
            subscription.unsubscribe();
          }
          subscriptions = [];
        }, 0);
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
