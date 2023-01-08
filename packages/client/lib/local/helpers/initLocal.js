import { APP_CONTEXT, ELEMENT_CONTEXT } from "../../keys.js";
import { h } from "../h.js";

import { isString, isObservable } from "../../helpers/typeChecking.js";
import { makeState, joinStates } from "../../helpers/state.js";
import { makeAttributes } from "../../helpers/makeAttributes.js";

import { ObserverBlueprint } from "../../view/blueprints/Observer.js";

export function initLocal(fn, config) {
  let { appContext, elementContext, attributes, children, channelPrefix, name } = config;

  channelPrefix = channelPrefix || "view";

  const $$children = makeState(children || []);

  const beforeConnectCallbacks = [];
  const afterConnectCallbacks = [];
  const beforeDisconnectCallbacks = [];
  const afterDisconnectCallbacks = [];

  let subscriptions = [];
  let isConnected = false;

  const channel = appContext.debug.makeChannel(`${channelPrefix}:${name || fn.name || "<anonymous>"}`);
  const attrs = makeAttributes(channel, attributes);

  /*=============================*\
  ||    Define context object    ||
  \*=============================*/

  // This is the object the setup function uses to interface with the component.
  const ctx = {
    [APP_CONTEXT]: appContext,
    [ELEMENT_CONTEXT]: elementContext,

    // Not sure if I want to force longhand for readability or shorthand for brevity.
    attributes: attrs.api,
    attrs: attrs.api,

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

    global(name) {
      if (!isString(name)) {
        throw new TypeError("Expected a string.");
      }

      if (appContext.globals[name]) {
        return appContext.globals[name].exports;
      }

      throw new Error(`Global '${name}' is not registered on this app.`);
    },

    local(name) {
      if (!isString(name)) {
        throw new TypeError("Expected a string.");
      }

      if (elementContext.locals?.[name]) {
        return elementContext.locals[name].exports;
      }

      throw new Error(`Local '${name}' is not connected upview.`);
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

  let exports;

  try {
    exports = fn(ctx, h);
  } catch (err) {
    console.error(err);
  }

  if (!isObject(exports)) {
    throw new TypeError(`Local functions must return an object. Got: ${exports}`);
  }

  /*=============================*\
  ||     Define view object      ||
  \*=============================*/

  const outlet = new ObserverBlueprint($$children.readable()).build({
    appContext,
    elementContext: {
      ...elementContext,
      locals: {
        ...(elementContext?.locals || {}),
        [attributes.as]: exports,
      },
    },
  });

  // This is the object the framework will use to control the view.
  const view = {
    /**
     * Returns the view's root DOM node, or null if there is none.
     */
    get node() {
      return outlet.node;
    },

    /**
     * True if the root DOM node is currently in the document.
     */
    get isConnected() {
      return outlet.isConnected;
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
      const wasConnected = outlet.isConnected;

      if (!wasConnected) {
        attrs.controls.connect();

        for (const callback of beforeConnectCallbacks) {
          callback();
        }
      }

      outlet.connect(parent, after);
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
      if (outlet.isConnected) {
        for (const callback of beforeDisconnectCallbacks) {
          callback();
        }

        outlet.disconnect();
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

      attrs.controls.disconnect();
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
