import { Attributes } from "../helpers/Attributes.js";
import { isFunction, isString } from "../helpers/typeChecking.js";
import { Connectable } from "./Connectable.js";
import { m, Markup } from "./Markup.js";

export class View extends Connectable {
  name;
  about;

  #lifecycleCallbacks = {
    beforeConnect: [],
    animateIn: [],
    afterConnect: [],

    beforeDisconnect: [],
    animateOut: [],
    afterDisconnect: [],
  };
  #activeSubscriptions = [];
  #channel;
  #attributes;
  #element;
  #$$children;

  get node() {
    return this.#element?.node;
  }

  constructor({
    appContext,
    elementContext = {},
    channelPrefix = "view",
    name = "<anonymous>",
    about,
    attributes = {},
    attributeDefs,
    children = [],
    setup = this.setup, // This is passed in directly to `new View()` to turn a standalone setup function into a view.
  }) {
    this.name = name;
    this.about = about;

    this.#channel = appContext.debug.makeChannel(`${channelPrefix}:${name}`);
    this.#attributes = new Attributes({
      attributes,
      definitions: attributeDefs,
    });
    this.#$$children = makeState(children);

    const ctx = {
      attrs: this.#attributes.api,
      attributes: this.#attributes.api,

      observe: (...args) => {
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

        if (this.isConnected) {
          // If called when the view is connected, we assume this code is in a lifecycle hook
          // where it will be triggered at some point again after the view is reconnected.
          this.#activeSubscriptions.push(start());
        } else {
          // This should only happen if called in the body of the view.
          // This code is not always re-run between when a view is disconnected and reconnected.
          this.#lifecycleCallbacks.afterConnect.push(() => {
            this.#activeSubscriptions.push(start());
          });
        }
      },

      global: (name) => {
        if (!isString(name)) {
          throw new TypeError("Expected a string.");
        }

        if (appContext.globals[name]) {
          return appContext.globals[name].exports;
        }

        throw new Error(`Global '${name}' is not registered on this app.`);
      },

      local: (name) => {
        if (!isString(name)) {
          throw new TypeError("Expected a string.");
        }

        if (elementContext.locals?.[name]) {
          return elementContext.locals[name].exports;
        }

        throw new Error(`Local '${name}' is not connected upview.`);
      },

      beforeConnect: (callback) => {
        this.#lifecycleCallbacks.beforeConnect.push(callback);
      },

      animateIn: (callback) => {
        this.#lifecycleCallbacks.animateIn.push(callback);
      },

      afterConnect: (callback) => {
        this.#lifecycleCallbacks.afterConnect.push(callback);
      },

      beforeDisconnect: (callback) => {
        this.#lifecycleCallbacks.beforeDisconnect.push(callback);
      },

      animateOut: (callback) => {
        this.#lifecycleCallbacks.animateOut.push(callback);
      },

      afterDisconnect: (callback) => {
        this.#lifecycleCallbacks.afterDisconnect.push(callback);
      },

      outlet: () => {
        return new ObserverBlueprint(this.#$$children);
      },
    };

    // Add debug methods.
    Object.defineProperties(ctx, Object.getOwnPropertyDescriptors(this.#channel));
    Object.defineProperty(ctx, "isConnected", {
      get: () => this.isConnected,
    });

    let element;

    try {
      element = setup(ctx, m);
    } catch (err) {
      console.error(err);
      throw err;
    }

    if (element === undefined) {
      throw new TypeError(`Views must return a markup element or return null to render nothing. Returned undefined.`);
    }

    if (element !== null) {
      // m() returns a Markup with something in it. Either an HTML tag, a view setup function or a viewable class.
      // Markup.init(config) is called, which passes config stuff to the viewable's constructor.
      if (!(element instanceof Markup)) {
        throw new TypeError(`Views must return a markup element, or null to render nothing. Returned ${element}.`);
      }

      this.#element = element.init({ appContext, elementContext });
    }

    if (isFunction(attributes.ref)) {
      attributes.ref(this.#element.node);
    }
  }

  setup(ctx) {
    throw new Error(`This view needs a setup function.`);
  }

  setChildren(children) {
    this.#$$children.set(children);
  }

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
      const wasConnected = this.isConnected;

      if (!wasConnected) {
        this.#attributes.connect();

        for (const callback of this.#lifecycleCallbacks.beforeConnect) {
          callback();
        }
      }

      if (this.#element) {
        this.#element.connect(parent, after);
      }

      if (!wasConnected) {
        if (this.#lifecycleCallbacks.animateIn.length > 0) {
          try {
            const ctx = { node: this.node };
            await Promise.all(this.#lifecycleCallbacks.animateIn.map((callback) => callback(ctx)));
          } catch (err) {
            console.error(err);
          }
        }

        setTimeout(() => {
          for (const callback of this.#lifecycleCallbacks.afterConnect) {
            callback();
          }

          resolve();
        }, 0);
      }
    });
  }

  /**
   * Disconnects this view from the DOM and runs lifecycle hooks.
   */
  async disconnect() {
    if (!this.isConnected) {
      return Promise.resolve();
    }

    return new Promise(async (resolve) => {
      for (const callback of this.#lifecycleCallbacks.beforeDisconnect) {
        callback();
      }

      if (this.#lifecycleCallbacks.animateOut.length > 0) {
        try {
          const ctx = { node: this.node };
          await Promise.all(this.#lifecycleCallbacks.animateOut.map((callback) => callback(ctx)));
        } catch (err) {
          console.error(err);
        }
      }

      if (this.#element) {
        this.#element.disconnect();
      }

      setTimeout(() => {
        for (const callback of this.#lifecycleCallbacks.afterDisconnect) {
          callback();
        }

        for (const subscription of this.#activeSubscriptions) {
          subscription.unsubscribe();
        }
        this.#activeSubscriptions = [];

        resolve();
      }, 0);

      this.#attributes.disconnect();
    });
  }
}
