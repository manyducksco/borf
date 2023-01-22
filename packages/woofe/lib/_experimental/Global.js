import { APP_CONTEXT } from "./keys.js";
import { isFunction, isObject, isObservable, isString } from "./helpers/typeChecking.js";
import { joinStates } from "./makeState.js";

export class Global {
  constructor(config) {
    if (isFunction(config)) {
      this.setup = config;
    } else if (isObject(config)) {
      this.name = config.name;
      this.setup = config.setup;
    } else {
      throw new TypeError(`Globals must be defined with a setup function or a config object. Got: ${config}`);
    }
  }

  get isGlobal() {
    return true;
  }

  instantiate(config) {
    return new GlobalInstance({
      ...config,
      name: config.name ?? this.name,
      setup: this.setup,
    });
  }
}

class GlobalInstance {
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

  get isGlobalInstance() {
    return true;
  }

  constructor(config) {
    const { appContext, channelPrefix, name } = config;

    this.#config = config;
    this.#channel = appContext.debug.makeChannel(`${channelPrefix || "global"}:${name || "<unnamed>"}`);

    const ctx = {
      [APP_CONTEXT]: appContext,

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

      global: (name) => {
        if (!isString(name)) {
          throw new TypeError("Expected a string.");
        }

        if (appContext.globals[name]) {
          return appContext.globals[name].exports;
        }

        throw new Error(`Global '${name}' is not registered on this app.`);
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
      exports = config.setup(ctx);
    } catch (err) {
      this.#channel.error(err);
    }

    if (!isObject(exports)) {
      throw new TypeError(`A global setup function must return an object. Got: ${exports}`);
    }

    this.exports = exports;
  }

  async beforeConnect() {
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
  }

  afterDisconnect() {
    this.#isConnected = false;

    for (const callback of this.#lifecycleCallbacks.afterDisconnect) {
      callback();
    }
  }
}
