import { APP_CONTEXT, ELEMENT_CONTEXT } from "../keys.js";
import { isObject, isObservable, isString } from "../helpers/typeChecking.js";
import { joinStates } from "../makeState.js";
import { Connectable } from "./Connectable.js";
import { Attributes } from "./Attributes.js";

export class Store extends Connectable {
  #node = document.createComment("Store");
  #lifecycleCallbacks = {
    beforeConnect: [],
    afterConnect: [],
    beforeDisconnect: [],
    afterDisconnect: [],
  };
  #activeSubscriptions = [];
  #isConnected = false;
  #config;
  #channel;
  #attributes;

  get node() {
    return this.#node;
  }

  constructor({
    appContext,
    elementContext,
    channelPrefix = "store",
    label = "<anonymous>",
    attributes = {},
    attributeDefs,
    setup, // This is passed in directly to `new Store()` to turn a standalone setup function into a store.
  }) {
    super();

    if (setup) {
      this.setup = setup;
    }

    this.#channel = appContext.debug.channel(`${channelPrefix}:${label}`);
    this.#attributes = new Attributes({ attributes, definitions: attributeDefs });

    const ctx = {
      [APP_CONTEXT]: appContext,
      [ELEMENT_CONTEXT]: elementContext,

      attrs: this.#attributes.api,

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

        if (this.#isConnected) {
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

          if (!_store.instance) {
            throw new Error(
              `Store '${name}' was accessed before it was set up. Make sure '${name}' is registered before components that access it.`
            );
          }

          return _store.instance.exports;
        }

        throw new Error(`Store '${name}' is not registered on this app.`);
      },

      beforeConnect: (callback) => {
        this.#lifecycleCallbacks.beforeConnect.push(callback);
      },

      afterConnect: (callback) => {
        this.#lifecycleCallbacks.afterConnect.push(callback);
      },

      beforeDisconnect: (callback) => {
        this.#lifecycleCallbacks.beforeDisconnect.push(callback);
      },

      afterDisconnect: (callback) => {
        this.#lifecycleCallbacks.afterDisconnect.push(callback);
      },
    };

    // Add debug channel methods.
    Object.defineProperties(ctx, Object.getOwnPropertyDescriptors(this.#channel));

    let exports;

    try {
      exports = this.setup(ctx);
    } catch (err) {
      this.#channel.error(err);
    }

    if (!isObject(exports)) {
      throw new TypeError(`A store setup function must return an object. Got: ${exports}`);
    }

    this.exports = exports;
  }

  setup() {
    throw new Error(`This store needs a setup function.`);
  }

  async connect(parent, after = null) {
    const wasConnected = this.isConnected;

    if (!wasConnected) {
      await this.beforeConnect();
    }

    await super.connect(parent, after);

    if (!wasConnected) {
      this.afterConnect();
    }
  }

  async disconnect() {
    const wasConnected = this.isConnected;

    if (!wasConnected) {
      await this.beforeDisconnect();
    }

    await super.disconnect();

    if (!wasConnected) {
      this.afterDisconnect();
    }
  }

  /**
   * Connects the store without running lifecycle callbacks.
   */
  async connectManual(parent, after = null) {
    await super.connect(parent, after);
  }

  /**
   * Disconnects the store without running lifecycle callbacks.
   */
  async disconnectManual() {
    await super.disconnect();
  }

  async beforeConnect() {
    this.#attributes.connect();

    for (const callback of this.#lifecycleCallbacks.beforeConnect) {
      await callback();
    }
  }

  afterConnect() {
    this.#isConnected = true;

    for (const callback of this.#lifecycleCallbacks.afterConnect) {
      callback();
    }
  }

  async beforeDisconnect() {
    for (const callback of this.#lifecycleCallbacks.beforeDisconnect) {
      await callback();
    }

    for (const sub of this.#activeSubscriptions) {
      sub.unsubscribe();
    }
    this.#activeSubscriptions = [];

    this.#attributes.disconnect();
  }

  afterDisconnect() {
    this.#isConnected = false;

    for (const callback of this.#lifecycleCallbacks.afterDisconnect) {
      callback();
    }
  }
}
