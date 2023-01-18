import { APP_CONTEXT } from "./keys.js";
import { isFunction, isObject, isObservable, isString } from "./helpers/typeChecking.js";
import { joinStates } from "./makeState.js";

export function makeGlobal(config) {
  return new Global(config);
}

class Global {
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
  _lifecycleCallbacks = {
    beforeConnect: [],
    afterConnect: [],
    beforeDisconnect: [],
    afterDisconnect: [],
  };
  _subscriptions = [];
  _isConnected = false;

  get isGlobalInstance() {
    return true;
  }

  constructor(config) {
    const { appContext, channelPrefix, name } = config;

    this._config = config;
    this._channel = appContext.debug.makeChannel(`${channelPrefix || "global"}:${name || "<unnamed>"}`);

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

        if (this._isConnected) {
          // If called when the view is connected, we assume this code is in a lifecycle hook
          // where it will be triggered at some point again after the view is reconnected.
          this._subscriptions.push(start());
        } else {
          // This should only happen if called in the body of the view.
          // This code is not always re-run between when a view is disconnected and reconnected.
          this._lifecycleCallbacks.afterConnect.push(() => {
            this._subscriptions.push(start());
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
        this._lifecycleCallbacks.beforeConnect.push(callback);
      },

      afterConnect: (callback) => {
        this._lifecycleCallbacks.afterConnect.push(callback);
      },

      beforeDisconnect: (callback) => {
        this._lifecycleCallbacks.beforeDisconnect.push(callback);
      },

      afterDisconnect: (callback) => {
        this._lifecycleCallbacks.afterDisconnect.push(callback);
      },
    };

    // Add debug channel methods.
    Object.defineProperties(ctx, Object.getOwnPropertyDescriptors(this._channel));

    let exports;

    try {
      exports = config.setup(ctx);
    } catch (err) {
      this._channel.error(err);
    }

    if (!isObject(exports)) {
      throw new TypeError(`A global setup function must return an object. Got: ${exports}`);
    }

    this.exports = exports;
  }

  async beforeConnect() {
    for (const callback of this._lifecycleCallbacks.beforeConnect) {
      await callback();
    }
  }

  afterConnect() {
    this._isConnected = true;

    for (const callback of this._lifecycleCallbacks.afterConnect) {
      callback();
    }
  }

  async beforeDisconnect() {
    for (const callback of this._lifecycleCallbacks.beforeDisconnect) {
      await callback();
    }

    for (const sub of this._subscriptions) {
      sub.unsubscribe();
    }
    this._subscriptions = [];
  }

  afterDisconnect() {
    this._isConnected = false;

    for (const callback of this._lifecycleCallbacks.afterDisconnect) {
      callback();
    }
  }
}
