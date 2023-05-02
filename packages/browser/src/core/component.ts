import { Type } from "@borf/bedrock";
import { Readable, Writable, type ValuesOfReadables, type StopFunction } from "./classes/Writable.js";
import { Markup } from "./classes/Markup.js";
import { APP_CONTEXT, ELEMENT_CONTEXT, setCurrentComponent, clearCurrentComponent } from "./keys.js";
import { type AppContext, type ElementContext } from "./classes/App.js";
import { type BuiltInStores } from "./types.js";
import { Outlet } from "./classes/Outlet.js";
import { Connectable } from "./classes/Connectable.js";
import { type DebugChannel } from "./classes/DebugHub.js";

export interface ComponentCore<I> {
  debug: DebugChannel;

  /**
   * Runs `callback` after this component is connected.
   */
  onConnected(callback: () => void): void;

  /**
   * Runs `callback` after this component is disconnected.
   */
  onDisconnected(callback: () => void): void;

  /**
   * Runs `callback` and awaits its promise before `onConnect` callbacks run.
   * Component is not considered connected until all `beforeConnected` promises resolve.
   */
  beforeConnected(callback: () => Promise<void>): void;

  /**
   * Runs `callback` and awaits its promise before `onDisconnect` callbacks run.
   * Component is not considered disconnected until all `beforeDisconnected` promises resolve.
   */
  beforeDisconnected(callback: () => Promise<void>): void;

  useStore<T extends Store<any, any>>(store: T): ReturnType<T> extends Promise<infer U> ? U : ReturnType<T>;
  useStore<N extends keyof BuiltInStores>(name: N): BuiltInStores[N];

  observe<T>(readable: Readable<T>, callback: (value: T) => void): void;
  observe<T extends Readable<any>[], V>(readables: T, callback: (...value: ValuesOfReadables<T>) => void): void;

  setLoader(loader: Markup): void;
  setLoader<I>(loader: View<I>, inputs?: I): void;

  /**
   * Sets the name of this view for debugging purposes.
   */
  setName(name: string): void;

  crash(error: Error): void;

  outlet(): Markup;
}

export type Component<I> = (attributes: I) => unknown;
export type Store<I, O> = (attributes: I) => O | Promise<O>;
export type View<I> = (attributes: I) => Markup | null | Promise<Markup | null>;

export function getAppContext(core: ComponentCore<any>) {
  return (core as any)[APP_CONTEXT] as AppContext;
}

export function getElementContext(core: ComponentCore<any>) {
  return (core as any)[ELEMENT_CONTEXT] as ElementContext;
}

/**
 * Parameters passed to the makeComponent function.
 */
interface ComponentConfig<I> {
  component: Component<I>;
  appContext: AppContext;
  elementContext: ElementContext;
  inputs: I;
  children?: Markup[];
}

/**
 * Methods for the framework to manipulate a component.
 */
export interface ComponentControls extends Connectable {
  $$children: Writable<Markup[]>;
  outputs?: object;
}

// Run component functions through a single function that initializes them in the same way and determines what kind of component they are based on the return value.

export function makeComponent<I>(config: ComponentConfig<I>): ComponentControls {
  let stopObserverCallbacks: (() => void)[] = [];
  let onConnectedCallbacks: (() => void)[] = [];
  let onDisconnectedCallbacks: (() => void)[] = [];
  let beforeConnectedCallbacks: (() => Promise<void>)[] = [];
  let beforeDisconnectedCallbacks: (() => Promise<void>)[] = [];

  let isConnected = false;
  let componentName = config.component.name ?? "anonymous";

  const $$children = new Writable(config.children ?? []);

  const appContext = config.appContext;
  const elementContext = {
    ...config.elementContext,
    $$children,
  };

  const debugChannel = appContext.debugHub.channel({
    get name() {
      return componentName;
    },
  });

  const core: ComponentCore<I> = {
    debug: debugChannel,

    onConnected(callback) {
      onConnectedCallbacks.push(callback);
    },
    onDisconnected(callback) {
      onDisconnectedCallbacks.push(callback);
    },
    beforeConnected(callback) {
      onDisconnectedCallbacks.push(callback);
    },
    beforeDisconnected(callback) {
      onDisconnectedCallbacks.push(callback);
    },

    useStore(store: keyof BuiltInStores | Store<any, any>) {
      const { appContext, elementContext } = config;
      let name: string;

      if (typeof store === "string") {
        name = store as keyof BuiltInStores;

        if (appContext.stores.has(store)) {
          const _store = appContext.stores.get(store)!;

          if (!_store.instance) {
            appContext.crashCollector.crash({
              componentName,
              error: new Error(
                `Store '${store}' was accessed before it was set up. Make sure '${store}' is registered before components that access it.`
              ),
            });
          }

          return _store.instance!.outputs;
        }
      } else {
        name = store.name;

        if (elementContext.stores.has(store)) {
          return elementContext.stores.get(store)!.instance!.outputs;
        }

        if (appContext.stores.has(store)) {
          const _store = appContext.stores.get(store)!;

          if (!_store.instance) {
            appContext.crashCollector.crash({
              componentName,
              error: new Error(
                `Store '${name}' was accessed before it was set up. Make sure '${name}' is registered before components that access it.`
              ),
            });
          }

          return _store.instance!.outputs;
        }
      }

      appContext.crashCollector.crash({
        componentName,
        error: new Error(`Store '${name}' is not registered on this app.`),
      });
    },

    setName(name) {
      componentName = name;
    },

    setLoader(content: any) {},

    observe(readable: Readable<any> | Readable<any>[], callback: (...args: any[]) => void) {
      const readables: Readable<any>[] = [];

      if (Array.isArray(readable) && readable.every(Readable.isReadable)) {
        readables.push(...readable);
      } else if (Readable.isReadable(readable)) {
        readables.push(readable);
      } else {
        throw new TypeError(`Expected one Readable or an array of Readables as the first argument.`);
      }

      if (readables.length === 0) {
        throw new TypeError(`Expected at least one readable.`);
      }

      const start = (): StopFunction => {
        if (readables.length > 1) {
          return Readable.merge(readables, callback).observe(() => {});
        } else {
          return readables[0].observe(callback);
        }
      };

      if (isConnected) {
        // If called when the component is connected, we assume this code is in a lifecycle hook
        // where it will be triggered at some point again after the component is reconnected.
        stopObserverCallbacks.push(start());
      } else {
        // This should only happen if called in the body of the setup function.
        // This code is not always re-run between when a component is disconnected and reconnected.
        onConnectedCallbacks.push(() => {
          stopObserverCallbacks.push(start());
        });
      }
    },

    crash(error) {
      appContext.crashCollector.crash({ error, componentName });
    },

    outlet() {
      return new Markup((config) => new Outlet({ ...config, readable: $$children }));
    },
  };

  // For secret internal funny business only.
  Object.defineProperties(core, {
    [APP_CONTEXT]: {
      value: appContext,
      enumerable: false,
      configurable: false,
    },
    [ELEMENT_CONTEXT]: {
      value: elementContext,
      enumerable: false,
      configurable: false,
    },
  });

  // Exported object from store. This is undefined for views.
  let outputs: object | undefined;

  // Either the markup from a view or the outlet from a store.
  let connectable: Connectable | undefined;

  async function initialize(parent: Node, after?: Node) {
    let result: unknown;

    try {
      setCurrentComponent(core);
      result = config.component(config.inputs);

      if (result instanceof Promise) {
        // TODO: Handle loading states
        result = await result;
      }
    } catch (error) {
      if (error instanceof Error) {
        appContext.crashCollector.crash({ error, componentName });
      } else {
        throw error;
      }
    } finally {
      clearCurrentComponent();
    }

    if (result instanceof Markup || result === null) {
      // Result is a view.
      connectable = result?.init({ appContext, elementContext });
    } else if (typeof result === "object" && !Array.isArray(result)) {
      // Result is a store.
      outputs = result;
      connectable = new Outlet({ appContext, elementContext, readable: $$children });
      elementContext.stores = new Map([...elementContext.stores.entries()]);
      elementContext.stores.set(config.component, { store: config.component, instance: controls });
    } else {
      console.warn(result, config);
      // Result is not usable.
      appContext.crashCollector.crash({
        error: new TypeError(
          `Expected '${
            config.component.name
          }' function to return Markup or null for a view, or an object for a store. Got: ${Type.of(result)}`
        ),
        componentName,
      });
    }
  }

  const controls: ComponentControls = {
    $$children,

    get outputs() {
      return outputs;
    },

    get node() {
      return connectable!.node;
    },

    get isConnected() {
      return isConnected;
    },

    async connect(parent: Node, after?: Node) {
      // Don't run lifecycle hooks or initialize if already connected.
      // Calling connect again can be used to re-order elements that are already connected to the DOM.
      const wasConnected = isConnected;

      if (!wasConnected) {
        // Initialize an instance of the component
        await initialize(parent, after);
      }

      if (connectable) {
        await connectable.connect(parent, after);
      }

      if (!wasConnected) {
        // Run beforeConnected
        for (const callback of beforeConnectedCallbacks) {
          await callback();
        }
        beforeConnectedCallbacks = [];

        // Mark component as connected
        isConnected = true;

        // Run onConnected
        for (const callback of onConnectedCallbacks) {
          callback();
        }
        onConnectedCallbacks = [];
      }
    },

    async disconnect() {
      // Run beforeDisconnected
      for (const callback of beforeDisconnectedCallbacks) {
        await callback();
      }
      beforeDisconnectedCallbacks = [];

      // Disconnect component
      if (connectable) {
        await connectable.disconnect();
      }

      // Mark as disconnected
      isConnected = false;

      // Run onDisconnected
      for (const callback of onDisconnectedCallbacks) {
        callback();
      }
      onDisconnectedCallbacks = [];
    },
  };

  return controls;
}
