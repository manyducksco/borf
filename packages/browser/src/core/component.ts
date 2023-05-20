import type { Renderable, Read, Write, Value, BuiltInStores } from "./types";

import { isArrayOf, isObject, typeOf } from "@borf/bedrock";
import { DOMHandle, Markup, getRenderHandle, isMarkup, makeMarkup, renderMarkupToDOM } from "./markup.js";
import { Readable, type ValuesOfReadables } from "./classes/Readable.js";
import { Writable } from "./classes/Writable.js";
import { type AppContext, type ElementContext } from "./classes/App.js";
import { type DebugChannel } from "./classes/DebugHub.js";
import { observeMany } from "./utils/observeMany.js";

export type Component<A> = (attributes: A, context: ComponentContext) => unknown;
export type Store<A, E> = (attributes: A, context: ComponentContext) => E | Promise<E>;
export type View<A> = (attributes: A, context: ComponentContext) => Markup | null | Promise<Markup | null>;

interface AsValueOptions<T> {
  /**
   * The default value if `value` is undefined.
   */
  default: T;
}

interface AsReadableOptions<T> {
  /**
   * The default value if `value` is undefined.
   */
  default: Exclude<T, undefined>;
}

interface AsWritableOptions<T> {
  /**
   * The default value if `value` is undefined.
   */
  default: T;
}

// TODO: Rename when hooks are phased out.
export interface ComponentContext extends DebugChannel {
  /**
   * Returns the nearest parent instance or app instance of `store`.
   */
  use<T extends Store<any, any>>(store: T): ReturnType<T> extends Promise<infer U> ? U : ReturnType<T>;
  /**
   * Returns an instance of a built-in store.
   */
  use<N extends keyof BuiltInStores>(name: N): BuiltInStores[N];

  /**
   * Returns the current value of an attribute.
   */
  asValue<T>(value: Read<T>): Value<T>;
  /**
   * Returns the current value of an attribute.
   */
  asValue<T>(value: Read<T>, options: AsValueOptions<T>): Value<Exclude<T, undefined>>;
  /**
   * Returns the current value of an attribute.
   */
  asValue<T>(value?: Read<T>): Value<T | undefined>;
  /**
   * Returns the current value of an attribute.
   */
  asValue<T>(value: Read<T> | undefined, options: AsValueOptions<T>): Value<Exclude<T, undefined>>;

  /**
   * Returns a Readable binding to a Read or Write attribute.
   */
  asReadable<T>(value: Read<T>): Readable<T>;
  /**
   * Returns a Readable binding to a Read or Write attribute.
   */
  asReadable<T>(value: Read<T>, options: AsReadableOptions<T>): Readable<Exclude<T, undefined>>;
  /**
   * Returns a Readable binding to a Read or Write attribute.
   */
  asReadable<T>(value?: Read<T>): Readable<T | undefined>;
  /**
   * Returns a Readable binding to a Read or Write attribute.
   */
  asReadable<T>(value: Read<T> | undefined, options: AsReadableOptions<T>): Readable<Exclude<T, undefined>>;

  /**
   * Returns a Writable binding to an attribute value. Changes to this writable will propagate to the original Writable.
   */
  asWritable<T>(value: Write<T> | T): Writable<T>;
  /**
   * Returns a Writable binding to an attribute value. Changes to this writable will propagate to the original Writable.
   */
  asWritable<T>(value: Write<T> | T, options: AsWritableOptions<T>): Writable<T>;
  /**
   * Returns a Writable binding to an attribute value. Changes to this writable will propagate to the original Writable.
   */
  asWritable<T>(value?: Write<T> | T): Writable<T | undefined>;
  /**
   * Returns a Writable binding to an attribute value. Changes to this writable will propagate to the original Writable.
   */
  asWritable<T>(value: Write<T> | T | undefined, options: AsWritableOptions<T>): Writable<T>;

  /**
   * Runs `callback` and awaits its promise before `onConnected` callbacks are called.
   * Component is not considered connected until all `beforeConnect` promises resolve.
   */
  beforeConnect(callback: () => Promise<any>): void;

  /**
   * Runs `callback` after this component is connected.
   */
  onConnected(callback: () => any): void;

  /**
   * Runs `callback` and awaits its promise before `onDisconnected` callbacks are called.
   * Component is not removed from the DOM until all `beforeDisconnect` promises resolve.
   */
  beforeDisconnect(callback: () => Promise<any>): void;

  /**
   * Runs `callback` after this component is disconnected.
   */
  onDisconnected(callback: () => any): void;

  /**
   * The name of this component for logging and debugging purposes.
   */
  name: string;

  /**
   * Sets loading content to be displayed while this component's setup is pending.
   * Only takes effect if this component function is async.
   */
  loader: Renderable;

  /**
   * Takes an Error object, unmounts the app and displays its crash page.
   */
  crash(error: Error): void;

  /**
   * Observes a readable value while this component is connected. Calls `callback` each time the value changes.
   */
  observe<T>(readable: Readable<T>, callback: (value: T) => void): void;

  /**
   * Observes a set of readable values while this component is connected.
   * Calls `callback` with each value in the same order as `readables` each time any of their values change.
   */
  observe<T extends Readable<any>[], V>(readables: [...T], callback: (...values: ValuesOfReadables<T>) => void): void;

  /**
   * Returns a Markup element that displays this component's children.
   */
  outlet(): Markup;
}

export interface ContextSecrets {
  appContext: AppContext;
  elementContext: ElementContext;
}

/**
 * Parameters passed to the makeComponent function.
 */
interface ComponentConfig<A> {
  component: Component<A>;
  appContext: AppContext;
  elementContext: ElementContext;
  attributes: A;
  children?: Markup[];
}

/**
 * Methods for the framework to manipulate a component.
 */
export interface ComponentHandle extends DOMHandle {
  $$children: Writable<Markup[]>;
  outputs?: object;
}

/*=====================================*\
||          Context Accessors          ||
\*=====================================*/

const SECRETS = Symbol("SECRETS");

export function getSecrets(ctx: ComponentContext): ContextSecrets {
  return (ctx as any)[SECRETS];
}

/*=====================================*\
||      Component Initialization       ||
\*=====================================*/

export function makeComponent<A>(config: ComponentConfig<A>): ComponentHandle {
  const appContext = config.appContext;
  const elementContext = { ...config.elementContext };
  const $$children = new Writable(config.children ?? []);

  let isConnected = false;

  // Lifecycle and observers
  const stopObserverCallbacks: (() => void)[] = [];
  const connectedCallbacks: (() => any)[] = [];
  const disconnectedCallbacks: (() => any)[] = [];
  const beforeConnectCallbacks: (() => Promise<any>)[] = [];
  const beforeDisconnectCallbacks: (() => Promise<any>)[] = [];

  const ctx: Omit<ComponentContext, keyof DebugChannel> = {
    name: config.component.name ?? "anonymous",
    loader: null,

    use(store: keyof BuiltInStores | Store<any, any>) {
      let name: string;

      if (typeof store === "string") {
        name = store as keyof BuiltInStores;

        if (appContext.stores.has(store)) {
          const _store = appContext.stores.get(store)!;

          if (!_store.instance) {
            appContext.crashCollector.crash({
              componentName: ctx.name,
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
              componentName: ctx.name,
              error: new Error(
                `Store '${name}' was accessed before it was set up. Make sure '${name}' is registered before components that access it.`
              ),
            });
          }

          return _store.instance!.outputs;
        }
      }

      appContext.crashCollector.crash({
        componentName: ctx.name,
        error: new Error(`Store '${name}' is not registered on this app.`),
      });
    },

    asValue<T>(value?: Read<T>, options?: AsValueOptions<T>) {
      if (Readable.isReadable<T>(value)) {
        return value.value;
      } else {
        if (value != null) {
          return value;
        }

        return options?.default;
      }
    },

    asReadable<T>(value?: Read<T>, options?: AsReadableOptions<T>) {
      if (Readable.isReadable<T>(value)) {
        return value;
      } else {
        if (value != null) {
          return new Readable(value);
        }

        return new Readable(options?.default);
      }
    },

    asWritable<T>(value?: Write<T> | T, options?: AsWritableOptions<T>) {
      if (Writable.isWritable<T>(value)) {
        return value;
      } else if (Readable.isReadable<T>(value)) {
        throw new Error(`Value must be writable. Got: ${value}`);
      } else {
        if (value != null) {
          return new Writable(value);
        }

        return new Writable(options?.default);
      }
    },

    onConnected(callback: () => any) {
      connectedCallbacks.push(callback);
    },

    onDisconnected(callback: () => any) {
      disconnectedCallbacks.push(callback);
    },

    beforeConnect(callback: () => Promise<any>) {
      beforeConnectCallbacks.push(callback);
    },

    beforeDisconnect(callback: () => Promise<any>) {
      beforeDisconnectCallbacks.push(callback);
    },

    crash(error: Error) {
      config.appContext.crashCollector.crash({ error, componentName: ctx.name });
    },

    observe(readables: any, callback: any) {
      const observer = observeMany(readables, callback);

      if (isConnected) {
        // If called when the component is connected, we assume this code is in a lifecycle hook
        // where it will be triggered at some point again after the component is reconnected.
        observer.start();
        stopObserverCallbacks.push(observer.stop);
      } else {
        // This should only happen if called in the body of the setup function.
        // This code is not always re-run between when a component is disconnected and reconnected.
        connectedCallbacks.push(() => {
          observer.start();
          stopObserverCallbacks.push(observer.stop);
        });
      }
    },

    outlet() {
      return makeMarkup("$dynamic", { value: $$children });
    },
  };

  const debugChannel = appContext.debugHub.channel({
    get name() {
      return ctx.name;
    },
  });

  Object.defineProperties(ctx, Object.getOwnPropertyDescriptors(debugChannel));

  Object.defineProperty(ctx, SECRETS, {
    enumerable: false,
    configurable: false,
    value: {
      appContext,
      elementContext,
    } as ContextSecrets,
  });

  // Exported object from store. This is undefined for views.
  let outputs: object | undefined;

  // Either the markup from a view or the outlet from a store.
  let rendered: DOMHandle | undefined;

  async function initialize(parent: Node, after?: Node) {
    let result: unknown;

    try {
      result = config.component(config.attributes, ctx as ComponentContext);

      if (result instanceof Promise) {
        // TODO: Handle loading states
        result = await result;
      }
    } catch (error) {
      if (error instanceof Error) {
        appContext.crashCollector.crash({ error, componentName: ctx.name });
      }
      throw error;
    }

    const renderContext = { app: appContext, element: elementContext };

    if (result === null) {
      // Do nothing.
    } else if (isMarkup(result) || isArrayOf<Markup>(isMarkup, result)) {
      // Result is a view.
      rendered = getRenderHandle(renderMarkupToDOM(result, renderContext));
    } else if (isObject(result)) {
      // Result is a store.
      outputs = result;
      rendered = getRenderHandle(renderMarkupToDOM(makeMarkup("$dynamic", { value: $$children }), renderContext));
      elementContext.stores = new Map([...elementContext.stores.entries()]);
      elementContext.stores.set(config.component, { store: config.component, instance: controls });
    } else {
      console.warn(result, config);
      // Result is not usable.
      appContext.crashCollector.crash({
        error: new TypeError(
          `Expected '${
            config.component.name
          }' function to return Markup or null for a view, or an object for a store. Got: ${typeOf(result)}`
        ),
        componentName: ctx.name,
      });
    }
  }

  const controls: ComponentHandle = {
    $$children,

    get outputs() {
      return outputs;
    },

    get node() {
      return rendered?.node!;
    },

    get connected() {
      return isConnected;
    },

    async connect(parent: Node, after?: Node) {
      // Don't run lifecycle hooks or initialize if already connected.
      // Calling connect again can be used to re-order elements that are already connected to the DOM.
      const wasConnected = isConnected;

      if (!wasConnected) {
        await initialize(parent, after);
      }

      if (rendered) {
        await rendered.connect(parent, after);
      }

      if (!wasConnected) {
        // Defer until DOM nodes are attached so beforeConnect can be used for animation.
        setTimeout(async () => {
          while (beforeConnectCallbacks.length > 0) {
            const callback = beforeConnectCallbacks.shift()!;
            await callback();
          }

          isConnected = true;

          while (connectedCallbacks.length > 0) {
            const callback = connectedCallbacks.shift()!;
            callback();
          }
        }, 0);
      }
    },

    async disconnect() {
      while (beforeDisconnectCallbacks.length > 0) {
        const callback = beforeDisconnectCallbacks.shift()!;
        await callback();
      }

      if (rendered) {
        await rendered.disconnect();
      }

      isConnected = false;

      while (disconnectedCallbacks.length > 0) {
        const callback = disconnectedCallbacks.shift()!;
        callback();
      }

      while (stopObserverCallbacks.length > 0) {
        const callback = stopObserverCallbacks.shift()!;
        callback();
      }
    },

    async setChildren() {
      $$children;
    },
  };

  return controls;
}
