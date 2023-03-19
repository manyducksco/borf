import { Type } from "@borf/bedrock";
import { APP_CONTEXT, ELEMENT_CONTEXT } from "../keys.js";
import { isMarkup } from "../helpers/typeChecking.js";
import { State } from "./State.js";
import { Connectable } from "./Connectable.js";
import { Inputs } from "./Inputs.js";
import { Outlet } from "./Outlet.js";

export class Store extends Connectable {
  static define(config) {
    // TODO: Disable this when built for production.
    if (!config.label) {
      console.trace(
        `Store is defined without a label. Setting a label is recommended for easier debugging and error tracing.`
      );
    }

    return class extends Store {
      static about = config.about;
      static label = config.label;
      static inputs = config.inputs;

      setup = config.setup;
    };
  }

  static isStore(value) {
    return value?.prototype instanceof Store;
  }

  static isInstance(value) {
    return value instanceof Store;
  }

  label;
  about;

  #node = document.createComment("Store");
  #outlet;
  #lifecycleCallbacks = {
    onConnect: [],
    onDisconnect: [],
  };
  #activeSubscriptions = [];
  #isConnected = false;
  #channel;
  #inputs;
  #$$children;
  #appContext;
  #elementContext;

  get node() {
    return this.#node;
  }

  constructor({
    appContext,
    elementContext,
    channelPrefix = "store",
    label = "<anonymous>",
    about,
    inputs = {},
    inputDefs,
    children = [],
    setup, // This is passed in directly to `new Store()` to turn a standalone setup function into a store.
  }) {
    super();

    this.label = label;
    this.about = about;

    if (setup) {
      this.setup = setup;
    }

    this.#appContext = appContext;
    this.#elementContext = {
      ...elementContext,
      stores: new Map([
        ...elementContext.stores.entries(),
        [this.constructor, { store: this.constructor, instance: this }],
      ]),
    };

    this.#channel = appContext.debugHub.channel(`${channelPrefix}:${label}`);
    this.#$$children = new State(children);
    this.#inputs = new Inputs({
      inputs,
      definitions: inputDefs,
      enableValidation: true,
    });
    this.#outlet = new Outlet({
      value: this.#$$children,
      appContext: this.#appContext,
      elementContext: this.#elementContext,
    });
  }

  async #initialize(parent, after = null) {
    const appContext = this.#appContext;
    const elementContext = this.#elementContext;

    const ctx = {
      [APP_CONTEXT]: appContext,
      [ELEMENT_CONTEXT]: elementContext,

      inputs: this.#inputs.api,

      /**
       * Takes an observable or array of observables. The observer receives each of their values as arguments whenever any observable receives a new value.
       */
      subscribe: (observable, observer) => {
        if (!Type.isObject(observer)) {
          observer = {
            next: observer,
            error: arguments[2],
            complete: arguments[3],
          };
        }

        let observables = [];

        if (Type.isArray(observable)) {
          observables = observable;
        } else {
          observables.push(observable);
        }

        if (observables.length === 0) {
          throw new TypeError(`Expected at least one observable.`);
        }

        const start = () => {
          if (observables.length > 1) {
            // TODO: Have State.merge forward errors to subscribers.
            return State.merge(observables, observer.next).subscribe({
              error: observer.error,
              complete: observer.complete,
            });
          } else {
            return observables[0].subscribe(observer);
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

        throw new Error(`Store '${name}' is not registered on this app.`);
      },

      onConnect: (callback) => {
        this.#lifecycleCallbacks.onConnect.push(callback);
      },

      onDisconnect: (callback) => {
        this.#lifecycleCallbacks.onDisconnect.push(callback);
      },

      crash: (error) => {
        appContext.crashCollector.crash({ error, component: this });
      },
    };

    // Add debug channel methods.
    Object.defineProperties(ctx, Object.getOwnPropertyDescriptors(this.#channel));

    let exports;

    try {
      exports = this.setup(ctx);
    } catch (error) {
      appContext.crashCollector.crash({ error, component: this });
    }

    // Display loading content while setup promise pends.
    if (Type.isPromise(exports)) {
      let cleanup;

      if (Type.isFunction(this.loading)) {
        // Render contents from loading() while waiting for setup to resolve.
        const content = this.loading(m);

        if (content === undefined) {
          throw new TypeError(`loading() must return a markup element, or null to render nothing. Returned undefined.`);
        }

        if (content !== null) {
          // m() returns a Markup with something in it. Either an HTML tag, a view setup function or a connectable class.
          // Markup.init(config) is called, which passes config stuff to the connectable's constructor.
          if (!isMarkup(content)) {
            throw new TypeError(
              `loading() must return a markup element, or null to render nothing. Returned ${element}.`
            );
          }
        }

        const component = content.init({ appContext, elementContext });
        component.connect(parent, after);

        cleanup = () => component.disconnect();
      }

      try {
        exports = await exports;
      } catch (error) {
        appContext.crashCollector.crash({ error, component: this });
      }

      if (cleanup) {
        cleanup();
      }
    }

    if (!Type.isObject(exports)) {
      throw new TypeError(`A store setup function must return an object. Got: ${exports}`);
    }

    this.exports = exports;
  }

  setup() {
    throw new Error(`This store needs a setup function.`);
  }

  setChildren(children) {
    this.#$$children.set(children);
  }

  async connect(parent, after = null) {
    const wasConnected = this.isConnected;

    if (!wasConnected) {
      await this.#initialize(parent, after);
      await this.beforeConnect();
    }

    await super.connect(parent, after);
    await this.#outlet.connect(parent, after);

    if (!wasConnected) {
      this.afterConnect();
    }
  }

  async disconnect() {
    const wasConnected = this.isConnected;

    if (!wasConnected) {
      await this.beforeDisconnect();
    }

    await this.#outlet.disconnect();
    await super.disconnect();

    if (!wasConnected) {
      this.afterDisconnect();
    }
  }

  /**
   * Connects the store without running lifecycle callbacks.
   */
  async connectManual(parent, after = null) {
    await this.#initialize(parent, after);
    await this.beforeConnect();

    await super.connect(parent, after);
    await this.#outlet.connect(parent, after);
  }

  /**
   * Disconnects the store without running lifecycle callbacks.
   */
  async disconnectManual() {
    await this.#outlet.disconnect();
    await super.disconnect();
  }

  async beforeConnect() {
    try {
      this.#inputs.connect();
    } catch (error) {
      this.#appContext.crashCollector.crash({ error, component: this });
    }

    // for (const callback of this.#lifecycleCallbacks.beforeConnect) {
    //   await callback();
    // }
  }

  afterConnect() {
    this.#isConnected = true;

    for (const callback of this.#lifecycleCallbacks.onConnect) {
      callback();
    }
  }

  async beforeDisconnect() {
    // for (const callback of this.#lifecycleCallbacks.beforeDisconnect) {
    //   await callback();
    // }

    for (const sub of this.#activeSubscriptions) {
      sub.unsubscribe();
    }
    this.#activeSubscriptions = [];

    this.#inputs.disconnect();
  }

  afterDisconnect() {
    this.#isConnected = false;

    for (const callback of this.#lifecycleCallbacks.onDisconnect) {
      callback();
    }
  }
}
