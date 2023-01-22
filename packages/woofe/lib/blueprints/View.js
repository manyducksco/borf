import { m } from "../helpers/markup.js";
import { isFunction, isObject, isString, isObservable } from "../helpers/typeChecking.js";
import { Attributes } from "../helpers/Attributes.js";
import { toBlueprint } from "../helpers/toBlueprints.js";
import { makeState, joinStates } from "../makeState.js";
import { ObserverBlueprint } from "./Observer.js";

export class ViewBlueprint {
  constructor(config) {
    if (isFunction(config)) {
      this.setup = config;
    } else if (isObject(config)) {
      this.name = config.name;
      this.setup = config.setup;
      this.attributeDefs = config.attributes;
    } else {
      throw new TypeError(`Views must be defined with a setup function or a config object. Got: ${config}`);
    }

    if (!this.setup) {
      throw new TypeError(`View has no setup function.`);
    }

    // These can be changed after the blueprint is created to set which children and attributes new views are built with.
    this.defaultChildren = config.defaultChildren ?? [];
    this.defaultAttributes = config.defaultAttributes ?? {};
  }

  get isBlueprint() {
    return true;
  }

  build(config) {
    return new View({
      attributes: this.defaultAttributes,
      children: this.defaultChildren,
      ...config,
      name: this.name,
      setup: this.setup,
      attributeDefs: this.attributeDefs,
    });
  }
}

class View {
  _lifecycleCallbacks = {
    beforeConnect: [],
    animateIn: [],
    afterConnect: [],

    beforeDisconnect: [],
    animateOut: [],
    afterDisconnect: [],
  };
  _activeSubscriptions = [];
  _isConnected = false;

  get isView() {
    return true;
  }

  get node() {
    return this._element?.node;
  }

  get isConnected() {
    return this._isConnected;
  }

  constructor(config) {
    this._config = config;

    this.name = config.name;
    this.about = config.about;

    this._channel = config.appContext.debug.makeChannel(
      `${config.channelPrefix || "view"}:${config.name || "<unnamed>"}`
    );
    this._attributes = new Attributes({
      attributes: config.attributes,
      definitions: config.attributeDefs,
    });
    this._$$children = makeState(config.children || []);

    const { setup, appContext, elementContext } = config;

    const ctx = {
      attrs: this._attributes.api,
      attributes: this._attributes.api,

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
          this._activeSubscriptions.push(start());
        } else {
          // This should only happen if called in the body of the view.
          // This code is not always re-run between when a view is disconnected and reconnected.
          this._lifecycleCallbacks.afterConnect.push(() => {
            this._activeSubscriptions.push(start());
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
        this._lifecycleCallbacks.beforeConnect.push(callback);
      },

      animateIn: (callback) => {
        this._lifecycleCallbacks.animateIn.push(callback);
      },

      afterConnect: (callback) => {
        this._lifecycleCallbacks.afterConnect.push(callback);
      },

      beforeDisconnect: (callback) => {
        this._lifecycleCallbacks.beforeDisconnect.push(callback);
      },

      animateOut: (callback) => {
        this._lifecycleCallbacks.animateOut.push(callback);
      },

      afterDisconnect: (callback) => {
        this._lifecycleCallbacks.afterDisconnect.push(callback);
      },

      outlet: () => {
        return new ObserverBlueprint(this._$$children);
      },
    };

    // Add debug methods.
    Object.defineProperties(ctx, Object.getOwnPropertyDescriptors(this._channel));
    Object.defineProperty(ctx, "isConnected", {
      get: () => this._isConnected,
    });

    let element;

    try {
      element = setup(ctx, m);
    } catch (err) {
      console.error(err);
      throw err;
    }

    if (element === undefined) {
      throw new TypeError(
        `Views must return an element, or explicitly return null to not render anything. Got: ${element}`
      );
    }

    if (element !== null) {
      const blueprint = toBlueprint(element);
      this._element = blueprint.build({
        appContext,
        elementContext,
        // attributes: config.attributes,
      });
    }

    if (isFunction(config.attributes?.ref)) {
      config.attributes.ref(this._element.node);
    }
  }

  setChildren(children) {
    this._$$children.set(children);
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
      const wasConnected = this._isConnected;

      if (!wasConnected) {
        this._attributes.connect();

        for (const callback of this._lifecycleCallbacks.beforeConnect) {
          callback();
        }
      }

      if (this._element) {
        this._element.connect(parent, after);
      }

      this._isConnected = true;

      if (!wasConnected) {
        if (this._lifecycleCallbacks.animateIn.length > 0) {
          try {
            const ctx = { node: this.node };
            await Promise.all(this._lifecycleCallbacks.animateIn.map((callback) => callback(ctx)));
          } catch (err) {
            console.error(err);
          }
        }

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
      if (this._isConnected) {
        for (const callback of this._lifecycleCallbacks.beforeDisconnect) {
          callback();
        }

        if (this._lifecycleCallbacks.animateOut.length > 0) {
          try {
            const ctx = { node: this.node };
            await Promise.all(this._lifecycleCallbacks.animateOut.map((callback) => callback(ctx)));
          } catch (err) {
            console.error(err);
          }
        }

        if (this._element) {
          this._element.disconnect();
        }

        this._isConnected = false;

        setTimeout(() => {
          for (const callback of this._lifecycleCallbacks.afterDisconnect) {
            callback();
          }

          for (const subscription of this._activeSubscriptions) {
            subscription.unsubscribe();
          }
          this._activeSubscriptions = [];

          resolve();
        }, 0);
      }

      this._attributes.disconnect();
    });
  }
}
