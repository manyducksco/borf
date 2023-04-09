import { type AppContext, type ElementContext } from "./App.js";
import { Connectable } from "./Connectable.js";
import { type InputDefinitions, type InputValues, Inputs, InputsAPI } from "./Inputs.js";
import { type DebugChannel } from "./DebugHub.js";
import { type Renderable, type Markup, type MarkupFunction } from "./Markup.js";
import { Writable, Readable, type ValuesOfReadables, type StopFunction } from "./Writable.js";
import { type BuiltInStores } from "../types.js";
import { APP_CONTEXT, ELEMENT_CONTEXT } from "../keys.js";

/*==========================*\
||     Component Object     ||
\*==========================*/

export interface ComponentDefinition<I> {
  /**
   * Name to identify this component in the console and dev tools.
   */
  label?: string;

  /**
   * Explanation of this component.
   */
  about?: string;

  /**
   * Values passed into this component, usually as HTML attributes.
   */
  inputs?: InputDefinitions<I>;

  /**
   * Displays temporary DOM nodes while the `setup` function's Promise resolves.
   */
  loading?: (m: MarkupFunction) => Renderable;
}

export interface CreateComponentConfig<I> {
  appContext: AppContext;
  elementContext: ElementContext;
  channelPrefix?: string;
  inputs?: InputValues<I>;
  children?: Markup[];
}

/**
 * Base class representing all user-created things that are rendered as HTML elements.
 */
export abstract class Component<I> {
  label;
  about;

  constructor(definition: ComponentDefinition<I>) {
    this.label = definition.label ?? "(anonymous)";
    this.about = definition.about;
  }

  create(config: CreateComponentConfig<I>): Connectable {
    throw new Error(`Implement this function.`);
  }

  static isComponent<I = unknown>(value: any): value is Component<I> {
    return value instanceof Component;
  }
}

/*==========================*\
||       Setup Context      ||
\*==========================*/

export interface ComponentContextConfig<I> {
  component: Component<I>;
  appContext: AppContext;
  elementContext: ElementContext;
  debugChannel: DebugChannel;
  inputs?: InputValues<I>;
  inputDefs?: InputDefinitions<I>;
  $$children: Writable<Markup[]>;
  setControls: (controls: ComponentContextControls<I>, ...args: any[]) => void;
}

export interface ComponentContextControls<I> {
  inputs: Inputs<I>;
  connect(): void;
  disconnect(): void;
}

/**
 * The object components receive as an argument to their `setup` function.
 */
export class ComponentContext<I> implements DebugChannel {
  #config: ComponentContextConfig<I>;
  #isConnected = false;

  #stopObserverCallbacks: (() => void)[] = [];
  #connectCallbacks: (() => void)[] = [];
  #disconnectCallbacks: (() => void)[] = [];

  inputs: InputsAPI<I>;

  log!: (...args: any[]) => void;
  warn!: (...args: any[]) => void;
  error!: (...args: any[]) => void;

  [APP_CONTEXT]: AppContext;
  [ELEMENT_CONTEXT]: ElementContext;

  constructor(config: ComponentContextConfig<I>) {
    this.#config = config;

    this[APP_CONTEXT] = config.appContext;
    this[ELEMENT_CONTEXT] = config.elementContext;

    const inputs = new Inputs({ inputs: config.inputs, definitions: config.inputDefs });
    this.inputs = inputs.api;

    Object.defineProperties(this, Object.getOwnPropertyDescriptors(config.debugChannel));

    // Pass controls object to callback.
    // This lets the code that created the instance control it
    // without exposing secret methods to code that uses the instance.
    config.setControls({
      inputs,
      connect: () => {
        this.#isConnected = true;
        for (const callback of this.#connectCallbacks) {
          callback();
        }
      },
      disconnect: () => {
        for (const callback of this.#stopObserverCallbacks) {
          callback();
        }
        this.#stopObserverCallbacks = [];

        this.#isConnected = false;
        for (const callback of this.#disconnectCallbacks) {
          callback();
        }
      },
    });
  }

  get isConnected(): boolean {
    return this.#isConnected;
  }

  onConnect(callback: () => void) {
    this.#connectCallbacks.push(callback);
  }

  onDisconnect(callback: () => void) {
    this.#disconnectCallbacks.push(callback);
  }

  observe<T>(readable: Readable<T>, callback: (value: T) => void): void;
  observe<T extends Readable<any>[], V>(readables: T, callback: (...value: ValuesOfReadables<T>) => void): void;

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

    if (this.isConnected) {
      // If called when the component is connected, we assume this code is in a lifecycle hook
      // where it will be triggered at some point again after the component is reconnected.
      this.#stopObserverCallbacks.push(start());
    } else {
      // This should only happen if called in the body of the setup function.
      // This code is not always re-run between when a component is disconnected and reconnected.
      this.#connectCallbacks.push(() => {
        this.#stopObserverCallbacks.push(start());
      });
    }
  }

  useStore<N extends keyof BuiltInStores>(name: N): BuiltInStores[N];
  useStore<S extends Store<any, any>>(store: S): S extends Store<any, infer U> ? U : never;

  useStore(store: keyof BuiltInStores | Store<any, any>) {
    const { appContext, elementContext, debugChannel } = this.#config;

    if (typeof store === "string") {
      store = store as keyof BuiltInStores;

      if (appContext.stores.has(store)) {
        const _store = appContext.stores.get(store)!;

        if (!_store.instance) {
          throw new Error(
            `Store '${store}' was accessed before it was set up. Make sure '${store}' is registered before components that access it.`
          );
        }

        return _store.instance.outputs;
      }
    } else {
      const name = store.name || store;

      if (elementContext.stores.has(store)) {
        if (appContext.stores.has(store)) {
          // Warn if shadowing a global, just in case this isn't intended.
          debugChannel.warn(`Using local store '${name}' which shadows global store '${name}'.`);
        }

        return elementContext.stores.get(store)!.instance!.outputs;
      }

      if (appContext.stores.has(store)) {
        const _store = appContext.stores.get(store)!;

        if (!_store.instance) {
          throw new Error(
            `Store '${name}' was accessed before it was set up. Make sure '${name}' is registered before components that access it.`
          );
        }

        return _store.instance.outputs;
      }

      throw new Error(`Store '${name}' is not registered on this app.`);
    }
  }

  crash(error: Error) {
    this.#config.appContext.crashCollector.crash({
      error,
      component: this.#config.component,
    });
  }
}

/*==========================*\
||         Instance         ||
\*==========================*/

export interface ComponentInstanceConfig<I> extends CreateComponentConfig<I> {
  component: Component<I>;
  inputs?: InputValues<I>;
  inputDefs?: InputDefinitions<I>;
  children: Markup[];
  loading?: (m: MarkupFunction) => Renderable;
}

export abstract class ComponentInstance<I> extends Connectable {
  // config!: ComponentInstanceConfig<I>;
  // context!: ComponentContext<I>;
  // contextControls!: ComponentContextControls<I>;
  $$children: Writable<Markup[]>;

  loading?: (m: MarkupFunction) => Renderable;

  constructor(config: ComponentInstanceConfig<I>) {
    super();

    this.$$children = new Writable(config.children);

    if (config.loading) {
      this.loading = config.loading;
    }

    // this.config = config;
    // this.context = new ComponentContext<I>({
    //   ...config,
    //   $$children: this.$$children,
    //   setControls: (controls) => {
    //     this.contextControls = controls;
    //   },
    // });
  }

  setChildren(children: Markup[]) {
    this.$$children.set(children);
  }

  async connect(parent: Node, after?: Node) {}

  async disconnect() {}
}
