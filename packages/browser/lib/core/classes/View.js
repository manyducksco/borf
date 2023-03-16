import { Type } from "@borf/bedrock";
import { State } from "./State.js";
import { Connectable } from "./Connectable.js";
import { Inputs } from "./Inputs.js";
import { Markup, m } from "./Markup.js";
import { Outlet } from "./Outlet.js";
import { isMarkup } from "../helpers/typeChecking.js";

export class View extends Connectable {
  static define(config) {
    if (!config.label) {
      console.trace(
        `View is defined without a label. Setting a label is recommended to make debugging and error tracing easier.`
      );
    }

    return class extends View {
      static about = config.about;
      static label = config.label;
      static inputs = config.inputs;

      setup = config.setup;
    };
  }

  static isView(value) {
    return value?.prototype instanceof View;
  }

  static isInstance(value) {
    return value instanceof View;
  }

  label;
  about;

  #lifecycleCallbacks = {
    // beforeConnect: [],
    animateIn: [],
    onConnect: [],

    // beforeDisconnect: [],
    animateOut: [],
    onDisconnect: [],
  };
  #activeSubscriptions = [];
  #channel;
  #inputs;
  #element;
  #$$children;

  #appContext;
  #elementContext;
  #ref;

  get node() {
    return this.#element?.node;
  }

  constructor({
    appContext,
    elementContext,
    channelPrefix = "view",
    label = "<anonymous>",
    about,
    inputs = {},
    inputDefs,
    children = [],
    setup,
  }) {
    super();

    this.label = label;
    this.about = about;

    if (setup) {
      this.setup = setup;
    }

    this.#appContext = appContext;
    this.#elementContext = elementContext;
    this.#ref = inputs.ref;

    this.#channel = appContext.debugHub.channel(`${channelPrefix}:${label}`);
    this.#inputs = new Inputs({
      inputs,
      definitions: inputDefs,
      enableValidation: true, // TODO: Disable for production builds (unless specified in makeApp options).
    });
    this.#$$children = new State(children);
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
        await this.#initialize(parent, after); // Run setup() to configure the view.

        this.#inputs.connect();

        // for (const callback of this.#lifecycleCallbacks.beforeConnect) {
        //   try {
        //     callback();
        //   } catch (error) {
        //     this.#appContext.crashCollector.crash({ error, component: this });
        //   }
        // }
      }

      if (this.#element) {
        this.#element.connect(parent, after);
      }

      if (!wasConnected) {
        if (this.#lifecycleCallbacks.animateIn.length > 0) {
          try {
            const ctx = { node: this.node };

            await Promise.all(this.#lifecycleCallbacks.animateIn.map((callback) => callback(ctx)));
          } catch (error) {
            this.#appContext.crashCollector.crash({ error, component: this });
          }
        }

        setTimeout(() => {
          for (const callback of this.#lifecycleCallbacks.onConnect) {
            try {
              callback();
            } catch (error) {
              this.#appContext.crashCollector.crash({ error, component: this });
            }
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
      // for (const callback of this.#lifecycleCallbacks.beforeDisconnect) {
      //   try {
      //     callback();
      //   } catch (error) {
      //     this.#appContext.crashCollector.crash({ error, component: this });
      //   }
      // }

      if (this.#lifecycleCallbacks.animateOut.length > 0) {
        try {
          const ctx = { node: this.node };
          await Promise.all(this.#lifecycleCallbacks.animateOut.map((callback) => callback(ctx)));
        } catch (error) {
          this.#appContext.crashCollector.crash({ error, component: this });
        }
      }

      if (this.#element) {
        this.#element.disconnect();
      }

      setTimeout(() => {
        for (const callback of this.#lifecycleCallbacks.onDisconnect) {
          try {
            callback();
          } catch (error) {
            this.#appContext.crashCollector.crash({ error, component: this });
          }
        }

        for (const subscription of this.#activeSubscriptions) {
          subscription.unsubscribe();
        }
        this.#activeSubscriptions = [];

        resolve();
      }, 0);

      this.#inputs.disconnect();
    });
  }

  /**
   * Prepares this view to be connected, handling loading state if necessary.
   *
   * @param parent - DOM node to connect loading content to.
   * @param after - Sibling DOM node directly after which this view's node should appear.
   */
  async #initialize(parent, after) {
    const appContext = this.#appContext;
    const elementContext = this.#elementContext;

    const ctx = {
      inputs: this.#inputs.api,

      /**
       * Takes one or more observables followed by a callback function that receives their values as arguments when any of the observables change.
       */
      observe: (...args) => {
        let callback = args.pop();

        if (args.length === 0) {
          throw new TypeError(`Expected at least one observable.`);
        }

        const start = () => {
          if (Type.isObservable(args.at(0))) {
            const $merged = State.merge(...args, callback);
            return $merged.subscribe(() => undefined);
          } else {
            const $merged = State.merge(...args, () => undefined);
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
          this.#lifecycleCallbacks.onConnect.push(() => {
            this.#activeSubscriptions.push(start());
          });
        }
      },

      /**
       * Returns the nearest matching store instance.
       *
       * @param store - A store class to access, or the name of a built-in store.
       */
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

          if (!_store.instance) {
            throw new Error(
              `Store '${name}' was accessed before it was set up. Make sure '${name}' is registered before components that access it.`
            );
          }

          return _store.instance.exports;
        }

        console.log(store, [...elementContext.stores.entries()]);

        throw new Error(`Store '${name}' is not registered on this app.`);
      },

      animateIn: (callback) => {
        this.#lifecycleCallbacks.animateIn.push(callback);
      },

      animateOut: (callback) => {
        this.#lifecycleCallbacks.animateOut.push(callback);
      },

      onConnect: (callback) => {
        this.#lifecycleCallbacks.onConnect.push(callback);
      },

      onDisconnect: (callback) => {
        this.#lifecycleCallbacks.onDisconnect.push(callback);
      },

      outlet: () => {
        return new Markup((config) => new Outlet({ ...config, value: this.#$$children }));
      },

      crash: (error) => {
        appContext.crashCollector.crash({ error, component: this });
      },
    };

    // Add debug channel methods directly to context.
    Object.defineProperties(ctx, Object.getOwnPropertyDescriptors(this.#channel));
    Object.defineProperty(ctx, "isConnected", {
      get: () => this.isConnected,
    });

    const assertUsable = (element) => {
      if (element === undefined) {
        throw new TypeError(`Views must return a markup element, or null to render nothing. Returned undefined.`);
      }

      if (element !== null) {
        // m() returns a Markup with something in it. Either an HTML tag, a view setup function or a connectable class.
        // Markup.init(config) is called, which passes config stuff to the connectable's constructor.
        if (!isMarkup(element)) {
          throw new TypeError(`Views must return a markup element, or null to render nothing. Returned ${element}.`);
        }
      }
    };

    let element;

    try {
      element = this.setup(ctx, m);
    } catch (error) {
      appContext.crashCollector.crash({ error, component: this });
    }

    // Display loading content while setup promise pends.
    if (Type.isPromise(element)) {
      let cleanup;

      if (Type.isFunction(this.loading)) {
        // Render contents from loading() while waiting for setup to resolve.
        const content = this.loading(m);
        assertUsable(content);

        const component = content.init({ appContext, elementContext });
        component.connect(parent, after);

        cleanup = () => component.disconnect();
      }

      try {
        element = await element;
      } catch (error) {
        appContext.crashCollector.crash({ error, component: this });
      }

      if (cleanup) {
        cleanup();
      }
    }

    assertUsable(element);
    this.#element = element.init({ appContext, elementContext });

    if (Type.isFunction(this.#ref)) {
      this.#ref(this.#element.node);
    }
  }
}
