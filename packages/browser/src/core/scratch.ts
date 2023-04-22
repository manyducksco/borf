import { Readable, Writable, type ValuesOfReadables, type StopFunction } from "./classes/Writable.js";
import { Inputs, InputsAPI, type UnwrapReadables } from "./classes/Inputs.js";
import { m, Markup } from "./classes/Markup.js";
import { APP_CONTEXT, ELEMENT_CONTEXT } from "./keys.js";
import { type AppContext, type ElementContext } from "./classes/App.js";
import { BuiltInStores } from "./types.js";
import { Outlet } from "./classes/Outlet.js";
import { Connectable } from "./classes/Connectable.js";

export interface ComponentCore<I> {
  inputs: InputsAPI<UnwrapReadables<I>>;

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

  useStore<T extends Store<any, any>>(store: T): ReturnType<T>;
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

function makeInputs<I>(values: I): [InputsAPI<UnwrapReadables<I>>, Inputs<I>] {
  const inputs = new Inputs(values);

  return [inputs.api, inputs];
}

export function getAppContext(core: ComponentCore<any>) {
  return (core as any)[APP_CONTEXT] as AppContext;
}

export function getElementContext(core: ComponentCore<any>) {
  return (core as any)[ELEMENT_CONTEXT] as ElementContext;
}

interface ComponentConfig<I> {
  appContext: AppContext;
  elementContext: ElementContext;
  component: Component<I>;
  inputs: I;
  children?: Markup[];
}

/**
 * Methods for the framework to manipulate a component.
 */
export interface ComponentControls extends Connectable {
  $$children: Writable<Markup[]>;
}

// Run component functions through a single function that initializes them in the same way and determines what kind of component they are based on the return value.

export function makeComponent<I>(config: ComponentConfig<I>): ComponentControls {
  const stopObserverCallbacks: (() => void)[] = [];
  const onConnectedCallbacks: (() => void)[] = [];
  const onDisconnectedCallbacks: (() => void)[] = [];
  const beforeConnectedCallbacks: (() => Promise<void>)[] = [];
  const beforeDisconnectedCallbacks: (() => Promise<void>)[] = [];

  const [inputs, inputsControls] = makeInputs(config.inputs);
  const $$children = new Writable(config.children ?? []);

  let isConnected = false;
  let componentName = config.component.name;

  const core: ComponentCore<I> = {
    inputs,

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

      if (typeof store === "string") {
        store = store as keyof BuiltInStores;

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

          return _store.instance.outputs;
        }
      } else {
        const name = store.name;

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

          return _store.instance.outputs;
        }

        appContext.crashCollector.crash({
          componentName,
          error: new Error(`Store '${name}' is not registered on this app.`),
        });
      }
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
      config.appContext.crashCollector.crash({ error, componentName });
    },

    outlet() {
      return new Markup((config) => new Outlet({ ...config, readable: $$children }));
    },
  };

  // For secret internal funny business only.
  Object.defineProperties(core, {
    [APP_CONTEXT]: {
      value: config.appContext,
      enumerable: false,
      configurable: false,
    },
    [ELEMENT_CONTEXT]: {
      value: config.elementContext,
      enumerable: false,
      configurable: false,
    },
  });

  async function initialize(parent: Node, after?: Node): Connectable {
    let result = config.component(core);

    if (result instanceof Promise) {
      // TODO: Handle loading states
      result = await result;
    }

    if (result instanceof Markup || result === null) {
      // Result is a view.
    } else if (typeof result === "object" && !Array.isArray(result)) {
      // Result is a store.
    } else {
      // Result is not usable.
      throw new TypeError(
        `Expected component function to return Markup or null for a view, or an object for a store. Got type: ${typeof result}, value: ${result}`
      );
    }
  }

  const controls: ComponentControls = {
    $$children,

    get node() {
      return document.createComment("REPLACE ME");
    },

    get isConnected() {
      return isConnected;
    },

    async connect(parent: Node, after?: Node) {
      inputsControls.connect();

      for (const callback of beforeConnectedCallbacks) {
        await callback();
      }

      for (const callback of onConnectedCallbacks) {
        callback();
      }
    },

    async disconnect() {
      for (const callback of beforeDisconnectedCallbacks) {
        await callback();
      }

      for (const callback of onDisconnectedCallbacks) {
        callback();
      }

      inputsControls.disconnect();
    },
  };

  return controls;
}

export type Component<I> = (ctx: ComponentCore<I>) => unknown;
export type Store<I, O> = (ctx: ComponentCore<I>) => O;
export type View<I> = (ctx: ComponentCore<I>) => Markup | null;

interface AppRouter {
  addRoute(pattern: string, view: View<any>, subroutes?: (router: AppRouter) => void): this;
  addRoute(pattern: string, view: null, subroutes: (router: AppRouter) => void): this;

  addRedirect(pattern: string, path: string): this;
}

class App implements AppRouter {
  /**
   * Displays view at the root of the app. All other routes render inside this view's outlet.
   */
  setRootView<I>(view: View<I>, inputs?: I) {
    return this;
  }

  /**
   * Displays view over top of all other app content while at least one async component promise is pending.
   */
  setSplashView<I>(view: View<I>, inputs?: I) {
    return this;
  }

  /**
   * Makes this store accessible from any other component in the app, except for stores registered before this one.
   */
  addStore<I>(store: Store<I, any>, inputs?: I) {
    return this;
  }

  addRoute(pattern: string, view: View<any>, subroutes?: (router: AppRouter) => void): this;
  addRoute(pattern: string, view: null, subroutes: (router: AppRouter) => void): this;

  addRoute(pattern: string, view: View<any> | null, subroutes?: (router: AppRouter) => void) {
    return this;
  }

  addRedirect(pattern: string, path: string) {
    return this;
  }

  async connect() {}

  async disconnect() {}
}

const app = new App();

interface ExampleStoreInputs {
  initialValue: number;
}

function ExampleStore(self: ComponentCore<ExampleStoreInputs>) {
  return {
    $value: new Readable(self.inputs.get("initialValue")),
  };
}

function ExampleView(self: ComponentCore<{}>) {
  const { $value } = self.useStore(ExampleStore);

  return m("p", "The value is", $value);
}

app.addStore(ExampleStore, {
  initialValue: 5,
});

app.setRootView(ExampleView);
