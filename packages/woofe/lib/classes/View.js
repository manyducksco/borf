import { isFunction, isString, isObservable } from "../helpers/typeChecking.js";
import { makeState, joinStates } from "../makeState.js";
import { Connectable } from "./Connectable.js";
import { Attributes } from "./Attributes.js";
import { Markup, m } from "./Markup.js";
import { Outlet } from "./Outlet.js";

export class View extends Connectable {
  label;
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
    elementContext,
    channelPrefix = "view",
    label = "<anonymous>",
    about,
    attributes = {},
    attributeDefs,
    children = [],
    setup, // This is passed in directly to `new View()` to turn a standalone setup function into a view.
  }) {
    super();

    this.label = label;
    this.about = about;

    if (!setup) {
      setup = this.setup.bind(this);
    }

    this.#channel = appContext.debug.makeChannel(`${channelPrefix}:${label}`);
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

      useStore: (store) => {
        const name = store?.name || store;

        if (elementContext.stores.has(store)) {
          if (appContext.stores.has(store)) {
            // Warn if shadowing a global, just in case this isn't intended.
            this.#channel.warn(`Using local store '${name}' which shadows global store '${name}'.`);
          }

          return elementContext.stores.get(store).instance.exports;
        }

        if (appContext.stores.has(store)) {
          const _store = appContext.stores.get(store);

          if (!_store.ready) {
            throw new Error(
              `Store '${name}' was accessed before it was set up. Make sure '${name}' appears earlier in the 'stores' array than other stores that access it.`
            );
          }

          return _store.instance.exports;
        }

        throw new Error(`Store '${name}' is not registered on this app.`);
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
        return new Markup((config) => new Outlet({ ...config, value: this.#$$children }));
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

  setup(ctx, m) {
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
