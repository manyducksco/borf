import { isFunction, isObject, isObservable, isString } from "../helpers/typeChecking.js";
import { makeAttributes } from "../helpers/makeAttributes.js";
import { makeState, joinStates } from "../makeState.js";

export class LocalBlueprint {
  constructor(config) {
    if (isFunction(config)) {
      this.setup = config;
    } else if (isObject(config)) {
      this.name = config.name;
      this.setup = config.setup;
      this.attributes = config.attributes;
    } else {
      throw new TypeError(`Views must be defined with a setup function or a config object. Got: ${config}`);
    }
  }

  get isBlueprint() {
    return true;
  }

  build(config) {
    return new LocalView({
      ...config,
      name: this.name,
      setup: this.setup,
      attributeDefs: this.attributes,
    });
  }
}

class LocalView {
  _lifecycleCallbacks = {
    beforeConnect: [],
    afterConnect: [],
    beforeDisconnect: [],
    afterDisconnect: [],
  };
  _subscriptions = [];

  get isView() {
    return true;
  }

  get node() {
    return this._outlet.node;
  }

  get isConnected() {
    return this._outlet.isConnected;
  }

  setChildren(children) {
    this._$$children.set(children);
  }

  constructor(config) {
    this._config = config;
    this._name = config.attributes.name;

    this._channel = config.appContext.debug.makeChannel(
      `${config.channelPrefix || "local"}:${config.name || "<unnamed>"}`
    );
    this._attributes = makeAttributes({
      attributes: omit(["name"], config.attributes),
      definitions: config.attributeDefs,
    });
    this._$$children = makeState(config.children || []);

    this.node = document.createComment(`local: ${config.name}`);

    const { setup, appContext, elementContext } = config;

    const ctx = {
      attrs: this._attributes.api,

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

        if (isConnected) {
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

      local: (name) => {
        if (!isString(name)) {
          throw new TypeError("Expected a string.");
        }

        if (elementContext.locals?.[name]) {
          return elementContext.locals[name].exports;
        }

        throw new Error(`Local '${name}' is not connected upview.`);
      },

      get isConnected() {
        return this.isConnected;
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

    // Add debug methods.
    Object.defineProperties(ctx, Object.getOwnPropertyDescriptors(this._channel));

    let exports;

    try {
      exports = setup(ctx);
    } catch (err) {
      this._channel.error(err);
    }

    if (!isObject(exports)) {
      throw new TypeError(`A local setup function must return an object. Got: ${exports}`);
    }

    this._outlet = new ObserverBlueprint(this._$$children.readable()).build({
      appContext,
      elementContext: {
        ...elementContext,
        locals: {
          ...(elementContext?.locals || {}),
          [this._name]: exports,
        },
      },
    });
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
        this._attributes.controls.connect();

        for (const callback of this._lifecycleCallbacks.beforeConnect) {
          callback();
        }
      }

      this._outlet.connect(parent, after);

      if (!wasConnected) {
        setTimeout(() => {
          for (const callback of this._lifecycleCallbacks.afterConnect) {
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
    return new Promise(async (resolve) => {
      if (this.isConnected) {
        for (const callback of this._lifecycleCallbacks.beforeDisconnect) {
          callback();
        }

        this._outlet.disconnect();

        setTimeout(() => {
          for (const callback of this._lifecycleCallbacks.afterDisconnect) {
            callback();
          }

          for (const subscription of this._subscriptions) {
            subscription.unsubscribe();
          }
          this._subscriptions = [];

          resolve();
        }, 0);
      }

      this._attributes.controls.disconnect();
    });
  }
}
