import type { AppContext } from "./App/App";
import type { DebugChannel } from "./DebugHub";
import type { Factory } from "../commonTypes";

import { Type } from "@borf/bedrock";

interface Subscription {
  unsubscribe(): void;
}

export type StoreSetupFn<E> = (ctx: StoreContext) => E;
export type StoreConstructor<E> = { new (options: StoreConfig): Store<E>; label?: string; about?: string };

export interface StoreRegistration<E> {
  store: StoreConstructor<E>;
  lifecycle: "app" | "request";
  instance?: Store<E>;
}

interface StoreDefinition<E> {
  label?: string;
  about?: string;
  setup: StoreSetupFn<E>;
}

interface StoreContext extends DebugChannel {
  useStore<S extends StoreConstructor<unknown>>(store: S): S extends StoreConstructor<infer U> ? U : unknown;

  readonly isConnected: boolean;

  /**
   * Registers a callback to run after the store is connected.
   */
  onConnect(callback: () => void): void;

  /**
   * Registers a callback to run after the store is disconnected.
   */
  onDisconnect(callback: () => void): void;

  crash(error: Error): void;
}

interface StoreConfig {
  appContext: AppContext;
  lifecycle?: "app" | "request";
  channelPrefix?: string;
  label?: string;
  about?: string;
}

export class Store<E> {
  static define<E>(def: StoreDefinition<E>): StoreConstructor<E> {
    // TODO: Disable this when built for production.
    if (!def.label) {
      console.trace(
        `Store is defined without a label. Setting a label is recommended for easier debugging and error tracing.`
      );
    }

    return class extends Store<E> {
      static about = def.about;
      static label = def.label;

      setup = def.setup;
    };
  }

  static isStore<E = unknown>(value: any): value is Store<E> {
    return value?.prototype instanceof Store;
  }

  label?: string;
  about?: string;
  lifecycle?: "app" | "request";

  exports?: E;

  #lifecycleCallbacks: Record<"onConnect" | "onDisconnect", (() => void)[]> = {
    onConnect: [],
    onDisconnect: [],
  };
  #activeSubscriptions: Subscription[] = [];
  #appContext;
  #channel;
  #isConnected = false;

  constructor({ appContext, lifecycle, channelPrefix = "store", label = "<anonymous>", about }: StoreConfig) {
    this.label = label;
    this.about = about;
    this.lifecycle = lifecycle;

    this.#appContext = appContext;
    this.#channel = appContext.debugHub.channel(`${channelPrefix}:${label}`);
  }

  async #initialize() {
    const appContext = this.#appContext;
    const getIsConnected = () => this.#isConnected;

    const ctx: Omit<StoreContext, "log" | "warn" | "error"> = {
      get isConnected() {
        return getIsConnected();
      },

      useStore: <S extends StoreConstructor<unknown>>(store: S): S extends StoreConstructor<infer U> ? U : unknown => {
        const name = store?.name || store;

        if (appContext.stores.has(store)) {
          const _store = appContext.stores.get(store);

          if (_store) {
            if (_store.lifecycle === "request" && this.lifecycle === "app") {
              throw new Error(
                `Store '${name}' is a request-lifecycle store, which can't be accessed by app-lifecycle store '${this.label}'.`
              );
            }

            if (!_store.instance) {
              throw new Error(
                `Store '${name}' was accessed before it was set up. Make sure '${name}' is registered before other stores that access it.`
              );
            }

            return _store.instance.exports as any;
          }
        }

        throw new Error(`Store '${name}' is not registered on this app.`);
      },

      onConnect: (callback: () => void) => {
        this.#lifecycleCallbacks.onConnect.push(callback);
      },

      onDisconnect: (callback: () => void) => {
        this.#lifecycleCallbacks.onDisconnect.push(callback);
      },

      crash: (error: Error) => {
        appContext.crashCollector.crash({ error, label: this.label });
      },
    };

    // Add debug channel methods.
    Object.defineProperties(ctx, Object.getOwnPropertyDescriptors(this.#channel));

    let exports;

    try {
      exports = this.setup(ctx as unknown as StoreContext);
    } catch (error) {
      if (error instanceof Error) {
        appContext.crashCollector.crash({ error, label: this.label });
      } else {
        console.error(error);
      }
    }

    // Wait while setup promise pends.
    if (Type.isPromise(exports)) {
      try {
        exports = await exports;
      } catch (error) {
        if (error instanceof Error) {
          appContext.crashCollector.crash({ error, label: this.label });
        } else {
          console.error(error);
        }
      }
    }

    if (!Type.isObject(exports)) {
      throw new Error(`A store setup function must return an object. Got type: ${Type.of(exports)}, value: ${exports}`);
    }

    this.exports = exports;
  }

  setup(ctx: StoreContext): E {
    throw new Error(`This store needs a setup function.`);
  }

  /**
   * Connects the store without running lifecycle callbacks.
   */
  async connect() {
    await this.#initialize();
    this.#isConnected = true;

    for (const callback of this.#lifecycleCallbacks.onConnect) {
      callback();
    }
  }

  /**
   * Disconnects the store without running lifecycle callbacks.
   */
  async disconnect() {
    for (const sub of this.#activeSubscriptions) {
      sub.unsubscribe();
    }
    this.#activeSubscriptions = [];
    this.#isConnected = false;

    for (const callback of this.#lifecycleCallbacks.onDisconnect) {
      callback();
    }
  }
}