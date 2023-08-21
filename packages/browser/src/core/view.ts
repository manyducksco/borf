import { isArrayOf, typeOf } from "@borf/bedrock";
import { type AppContext, type ElementContext } from "./App.js";
import { type DebugChannel } from "./DebugHub.js";
import { getRenderHandle, isMarkup, m, renderMarkupToDOM, type DOMHandle, type Markup } from "./markup.js";
import { isReadable, readable, writable, type Readable, type ReadableValues } from "./state.js";
import { type Store } from "./store.js";
import type { BuiltInStores, Renderable } from "./types.js";
import { observeMany } from "./utils/observeMany.js";

/*=====================================*\
||                Types                ||
\*=====================================*/

/**
 * Any valid value that a View can return.
 */
export type ViewResult = Node | Readable<any> | Markup | Markup[] | null;

export type View<A> = (attributes: A, context: ViewContext) => ViewResult | Promise<ViewResult>;

export interface ViewContext extends DebugChannel {
  /**
   * Returns the shared instance of `store`.
   */
  use<T extends Store<any, any>>(store: T): ReturnType<T> extends Promise<infer U> ? U : ReturnType<T>;

  /**
   * Returns the shared instance of a built-in store.
   */
  use<N extends keyof BuiltInStores>(name: N): BuiltInStores[N];

  /**
   * Runs `callback` and awaits its promise before `onConnected` callbacks are called.
   * View is not considered connected until all `beforeConnect` promises resolve.
   */
  beforeConnect(callback: () => Promise<any>): void;

  /**
   * Runs `callback` after this view is connected.
   */
  onConnected(callback: () => any): void;

  /**
   * Runs `callback` and awaits its promise before `onDisconnected` callbacks are called.
   * View is not removed from the DOM until all `beforeDisconnect` promises resolve.
   */
  beforeDisconnect(callback: () => Promise<any>): void;

  /**
   * Runs `callback` after this view is disconnected.
   */
  onDisconnected(callback: () => any): void;

  /**
   * The name of this view for logging and debugging purposes.
   */
  name: string;

  /**
   * Sets loading content to be displayed while this view's promise is pending.
   * Only takes effect if this view function is async.
   */
  loader: Renderable;

  /**
   * Takes an Error object, unmounts the app and displays its crash page.
   */
  crash(error: Error): void;

  /**
   * Observes a readable value while this view is connected. Calls `callback` each time the value changes.
   */
  observe<T>(readable: Readable<T>, callback: (value: T) => void): void;

  /**
   * Observes a set of readable values while this view is connected.
   * Calls `callback` with each value in the same order as `readables` each time any of their values change.
   */
  observe<T extends Readable<any>[], V>(readables: [...T], callback: (...values: ReadableValues<T>) => void): void;

  /**
   * Returns a Markup element that displays this view's children.
   */
  outlet(): Markup;
}

/*=====================================*\
||          Context Accessors          ||
\*=====================================*/

export interface ViewContextSecrets {
  appContext: AppContext;
  elementContext: ElementContext;
}

const SECRETS = Symbol("VIEW_SECRETS");

export function getViewSecrets(ctx: ViewContext): ViewContextSecrets {
  return (ctx as any)[SECRETS];
}

/*=====================================*\
||              View Init              ||
\*=====================================*/

/**
 * Parameters passed to the makeView function.
 */
interface ViewConfig<A> {
  view: View<A>;
  appContext: AppContext;
  elementContext: ElementContext;
  attributes: A;
  children?: Markup[];
}

export function makeView<A>(config: ViewConfig<A>): DOMHandle {
  const appContext = config.appContext;
  const elementContext = { ...config.elementContext };
  const $$children = writable<DOMHandle[]>(renderMarkupToDOM(config.children ?? [], { appContext, elementContext }));

  let isConnected = false;

  // Lifecycle and observers
  const stopObserverCallbacks: (() => void)[] = [];
  const connectedCallbacks: (() => any)[] = [];
  const disconnectedCallbacks: (() => any)[] = [];
  const beforeConnectCallbacks: (() => Promise<any>)[] = [];
  const beforeDisconnectCallbacks: (() => Promise<any>)[] = [];

  const c: Omit<ViewContext, keyof DebugChannel> = {
    name: config.view.name ?? "anonymous",
    loader: null,

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
            error: new Error(`Store '${name}' is not registered on this app.`),
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

    beforeConnect(callback: () => Promise<any>) {
      beforeConnectCallbacks.push(callback);
    },

    beforeDisconnect(callback: () => Promise<any>) {
      beforeDisconnectCallbacks.push(callback);
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

    outlet() {
      return m("$outlet", { $children: readable($$children) });
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
    } as ViewContextSecrets,
  });

  let rendered: DOMHandle | undefined;

  async function initialize(parent: Node, after?: Node) {
    let result: unknown;

    try {
      result = config.view(config.attributes, c as ViewContext);

      if (result instanceof Promise) {
        // TODO: Handle loading states
        result = await result;
      }
    } catch (error) {
      if (error instanceof Error) {
        appContext.crashCollector.crash({ error, componentName: c.name });
      }
      throw error;
    }

    if (result === null) {
      // Do nothing.
    } else if (result instanceof Node) {
      rendered = getRenderHandle(renderMarkupToDOM(m("$node", { value: result }), { appContext, elementContext }));
    } else if (isMarkup(result) || isArrayOf<Markup>(isMarkup, result)) {
      rendered = getRenderHandle(renderMarkupToDOM(result, { appContext, elementContext }));
    } else if (isReadable(result)) {
      rendered = getRenderHandle(
        renderMarkupToDOM(m("$observer", { readables: [result], renderFn: (x) => x }), { appContext, elementContext })
      );
    } else {
      console.warn(result, config);
      appContext.crashCollector.crash({
        error: new TypeError(
          `Expected '${
            config.view.name
          }' function to return a DOM node, Markup element, Readable or null. Got: ${typeOf(result)}`
        ),
        componentName: c.name,
      });
    }
  }

  const handle: DOMHandle = {
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

    async setChildren(children) {
      $$children.set(children);
    },
  };

  return handle;
}
