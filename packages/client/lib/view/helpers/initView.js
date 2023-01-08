import { APP_CONTEXT, ELEMENT_CONTEXT } from "../../keys.js";
import { h } from "../h.js";

import { omit } from "../../helpers/omit.js";
import { isDOM, isView, isString, isObservable } from "../../helpers/typeChecking.js";
import { makeState, joinStates } from "../../helpers/state.js";
import { makeAttributes } from "../../helpers/makeAttributes.js";

import { ObserverBlueprint } from "../blueprints/Observer.js";

class DOMAdapterView {
  constructor(node) {
    this.node = node;
  }

  get isView() {
    return true;
  }

  get isConnected() {
    return this.node.parentNode != null;
  }

  connect(parent, after = null) {
    parent.insertBefore(this.node, after?.nextSibling);
  }

  disconnect() {
    this.node.parentNode?.removeChild(this.node);
  }
}

export function initView(fn, config) {
  let { appContext, elementContext, children, channelPrefix } = config;

  channelPrefix = channelPrefix || "view";

  const $$children = makeState(children || []);
  const traits = fn._traits ?? [];
  const attributes = { ...config.attributes };

  const beforeConnectCallbacks = [];
  const afterConnectCallbacks = [];
  const beforeDisconnectCallbacks = [];
  const afterDisconnectCallbacks = [];

  let subscriptions = [];
  let isConnected = false;

  let transitions = traits.find((t) => t._trait === "transitions");
  let mapToCSS;

  if (transitions) {
    mapToCSS = transitions.mapToCSS;
    transitions = transitions.create(mapToCSS);

    // Forward exports as attributes unless mapToCSS is defined.
    if (!mapToCSS) {
      Object.assign(attributes, transitions.exports);
    }
  }

  const name = traits.find((t) => t._trait === "name")?.name || "<unnamed>";
  const channel = appContext.debug.makeChannel(`${channelPrefix}:${name}`);
  const attrs = makeAttributes(channel, attributes, traits.find((t) => t._trait === "attributes")?.definitions);

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

    /**
     * Renders nested elements passed to this view.
     */
    outlet() {
      return new ObserverBlueprint($$children.readable());
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

  let element = fn(ctx);

  if (element !== null) {
    if (element.isBlueprint) {
      element = element.build({ appContext, elementContext });
    } else if (isDOM(element)) {
      element = new DOMAdapterView(element);
    } else {
      throw new TypeError(`Views must return a blueprint, a DOM node or null. Got: ${element}`);
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
        return element.node;
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
    async connect(parent, after = null) {
      return new Promise(async (resolve) => {
        const wasConnected = view.isConnected;

        if (!wasConnected) {
          attrs.controls.connect();

          for (const callback of beforeConnectCallbacks) {
            callback();
          }
        }

        if (element) {
          element.connect(parent, after);
        }

        isConnected = true;

        if (!wasConnected) {
          if (transitions) {
            try {
              await transitions.enter(element.node);
            } catch (err) {
              console.error(err);
            }
          }

          setTimeout(() => {
            for (const callback of afterConnectCallbacks) {
              callback();
            }

            resolve();
          }, 0);
        }
      });
    },

    /**
     * Disconnects this view from the DOM and runs lifecycle hooks.
     */
    async disconnect() {
      return new Promise(async (resolve) => {
        if (view.isConnected) {
          for (const callback of beforeDisconnectCallbacks) {
            callback();
          }

          if (transitions) {
            try {
              await transitions.exit(element.node);
            } catch (err) {
              console.error(err);
            }
          }

          if (element) {
            element.disconnect();
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

            resolve();
          }, 0);
        }

        attrs.controls.disconnect();
      });
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
