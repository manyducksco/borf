import { isObject, typeOf } from "@borf/bedrock";
import { type AppContext, type ElementContext } from "./App.js";
import { type DebugChannel } from "./DebugHub.js";
import { Readable, type ReadableValues } from "./state.js";
import type { BuiltInStores } from "./types.js";
import { observeMany } from "./utils/observeMany.js";

/*=====================================*\
||                Types                ||
\*=====================================*/

export type Store<O, E> = (context: StoreContext<O>) => E | Promise<E>;

export interface StoreContext<Options = any> extends DebugChannel {
  /**
   * Returns the shared instance of `store`.
   */
  use<T extends Store<any, any>>(store: T): ReturnType<T> extends Promise<infer U> ? U : ReturnType<T>;

  /**
   * Returns the shared instance of a built-in store.
   */
  use<N extends keyof BuiltInStores>(name: N): BuiltInStores[N];

  /**
   * Runs `callback` after this store is connected.
   */
  onConnected(callback: () => any): void;

  /**
   * Runs `callback` after this store is disconnected.
   */
  onDisconnected(callback: () => any): void;

  /**
   * The name of this store for logging and debugging purposes.
   */
  name: string;

  /**
   * Takes an Error object, unmounts the app and displays its crash page.
   */
  crash(error: Error): void;

  /**
   * Observes a readable value while this store is connected. Calls `callback` each time the value changes.
   */
  observe<T>(readable: Readable<T>, callback: (value: T) => void): void;

  /**
   * Observes a set of readable values while this store is connected.
   * Calls `callback` with each value in the same order as `readables` each time any of their values change.
   */
  observe<T extends Readable<any>[], V>(readables: [...T], callback: (...values: ReadableValues<T>) => void): void;

  /**
   * Options this store was initialized with.
   */
  options: Options;
}

/*=====================================*\
||          Context Accessors          ||
\*=====================================*/

export interface StoreContextSecrets {
  appContext: AppContext;
  elementContext: ElementContext;
}

const SECRETS = Symbol("STORE_SECRETS");

export function getStoreSecrets(c: StoreContext): StoreContextSecrets {
  return (c as any)[SECRETS];
}

/*=====================================*\
||             Store Init              ||
\*=====================================*/

export function store<O>(callback: Store<any, O>) {
  return callback;
}

/**
 * Parameters passed to the makeStore function.
 */
interface StoreConfig<O> {
  store: Store<O, any>;
  appContext: AppContext;
  elementContext: ElementContext;
  options: O;
}

export function initStore<O>(config: StoreConfig<O>) {
  const appContext = config.appContext;
  const elementContext = config.elementContext;

  let isConnected = false;

  // Lifecycle and observers
  const stopObserverCallbacks: (() => void)[] = [];
  const connectedCallbacks: (() => any)[] = [];
  const disconnectedCallbacks: (() => any)[] = [];

  const c: Omit<StoreContext, keyof DebugChannel> = {
    name: config.store.name ?? "anonymous",
    options: config.options,

    use(store: keyof BuiltInStores | Store<any, any>) {
      let name: string;

      if (typeof store === "string") {
        name = store as keyof BuiltInStores;
      } else {
        name = store.name;
      }

      if (appContext.stores.has(store)) {
        const _store = appContext.stores.get(store)!;

        if (!_store.instance) {
          appContext.crashCollector.crash({
            componentName: c.name,
            error: new Error(
              `Store '${name}' was accessed before it was set up. Make sure '${name}' is registered before components that access it.`
            ),
          });
        }

        return _store.instance!.exports;
      }

      appContext.crashCollector.crash({
        componentName: c.name,
        error: new Error(`Store '${name}' is not registered on this app.`),
      });
    },

    onConnected(callback: () => any) {
      connectedCallbacks.push(callback);
    },

    onDisconnected(callback: () => any) {
      disconnectedCallbacks.push(callback);
    },

    crash(error: Error) {
      config.appContext.crashCollector.crash({ error, componentName: c.name });
    },

    observe(readables: any, callback: any) {
      const observer = observeMany(readables, callback);

      if (isConnected) {
        // If called when the component is connected, we assume this code is in a lifecycle hook
        // where it will be triggered at some point again after the component is reconnected.
        observer.start();
        stopObserverCallbacks.push(observer.stop);
      } else {
        // This should only happen if called in the body of the component function.
        // This code is not always re-run between when a component is disconnected and reconnected.
        connectedCallbacks.push(() => {
          observer.start();
          stopObserverCallbacks.push(observer.stop);
        });
      }
    },
  };

  const debugChannel = appContext.debugHub.channel({
    get name() {
      return c.name;
    },
  });

  Object.defineProperties(c, Object.getOwnPropertyDescriptors(debugChannel));

  Object.defineProperty(c, SECRETS, {
    enumerable: false,
    configurable: false,
    value: {
      appContext,
      elementContext,
    } as StoreContextSecrets,
  });

  let exports: any;

  return {
    get name() {
      return c.name;
    },

    get exports() {
      return exports;
    },

    async setup() {
      let result: unknown;

      try {
        result = config.store(c as StoreContext<O>);

        if (result instanceof Promise) {
          result = await result;
        }
      } catch (error) {
        if (error instanceof Error) {
          appContext.crashCollector.crash({ error, componentName: c.name });
        } else {
          throw error;
        }
      }

      if (!isObject(result)) {
        const error = new TypeError(`Expected ${c.name} function to return an object. Got: ${typeOf(result)}`);
        appContext.crashCollector.crash({ error, componentName: c.name });
      }

      exports = result;
    },

    async connect() {
      while (connectedCallbacks.length > 0) {
        const callback = connectedCallbacks.shift()!;
        callback();
      }
    },

    async disconnect() {
      while (disconnectedCallbacks.length > 0) {
        const callback = disconnectedCallbacks.shift()!;
        callback();
      }
    },
  };
}
