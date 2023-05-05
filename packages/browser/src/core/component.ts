import { typeOf } from "@borf/bedrock";
import { Writable } from "./classes/Writable.js";
import { Markup } from "./classes/Markup.js";
import { Dynamic } from "./classes/Dynamic.js";
import { type AppContext, type ElementContext } from "./classes/App.js";
import { type Connectable } from "./types.js";
import { type DebugChannel } from "./classes/DebugHub.js";

export type Component<A> = (attributes: A) => unknown;
export type Store<A, E> = (attributes: A) => E | Promise<E>;
export type View<A> = (attributes: A) => Markup | null | Promise<Markup | null>;

/**
 * The core state of a component. Hooks access this object.
 */
export interface ComponentContext {
  appContext: AppContext;
  elementContext: ElementContext;

  isConnected: boolean;
  name: string;
  debugChannel: DebugChannel;
  $$children: Writable<Markup[]>;
  loadingContent?: Markup;

  // Lifecycle and observers
  stopObserverCallbacks: (() => void)[];
  connectedCallbacks: (() => void)[];
  disconnectedCallbacks: (() => void)[];
  beforeConnectCallbacks: (() => Promise<void>)[];
  beforeDisconnectCallbacks: (() => Promise<void>)[];
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
export interface ComponentControls extends Connectable {
  $$children: Writable<Markup[]>;
  outputs?: object;
}

/*=====================================*\
||     Context Accessors for Hooks     ||
\*=====================================*/

const COMPONENT_CONTEXT = Symbol("ComponentContext");

/**
 * Used by hooks to get the current component context.
 */
export function getCurrentContext(): ComponentContext {
  const ctx = (window as any)[COMPONENT_CONTEXT];
  if (!ctx) {
    throw new Error("Hooks must be called in the body of a component function.");
  }
  return ctx;
}

/**
 * Used by components to set themselves as current while running the setup function.
 */
function setCurrentContext(ctx: ComponentContext) {
  (window as any)[COMPONENT_CONTEXT] = ctx;
}

/**
 * Used by components to clear the current component after finished setting up.
 */
function clearCurrentContext() {
  (window as any)[COMPONENT_CONTEXT] = undefined;
}

/*=====================================*\
||      Component Initialization       ||
\*=====================================*/

export function makeComponent<A>(config: ComponentConfig<A>): ComponentControls {
  const ctx: ComponentContext = {
    name: config.component.name ?? "anonymous",
    $$children: new Writable(config.children ?? []),
    isConnected: false,
    appContext: config.appContext,
    elementContext: { ...config.elementContext },
    debugChannel: config.appContext.debugHub.channel({
      get name() {
        return ctx.name;
      },
    }),

    // Lifecycle and observers
    stopObserverCallbacks: [],
    connectedCallbacks: [],
    disconnectedCallbacks: [],
    beforeConnectCallbacks: [],
    beforeDisconnectCallbacks: [],
  };

  // Exported object from store. This is undefined for views.
  let outputs: object | undefined;

  // Either the markup from a view or the outlet from a store.
  let connectable: Connectable | undefined;

  async function initialize(parent: Node, after?: Node) {
    let result: unknown;

    const { appContext, elementContext, $$children, name: componentName } = ctx;

    try {
      setCurrentContext(ctx);
      result = config.component(config.attributes);

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
      clearCurrentContext();
    }

    if (result instanceof Markup || result === null) {
      // Result is a view.
      connectable = result?.init({ appContext, elementContext });
    } else if (typeof result === "object" && !Array.isArray(result)) {
      // Result is a store.
      outputs = result;
      connectable = new Dynamic({ appContext, elementContext, readable: $$children });
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
        componentName,
      });
    }
  }

  const controls: ComponentControls = {
    $$children: ctx.$$children,

    get outputs() {
      return outputs;
    },

    get node() {
      return connectable!.node;
    },

    get isConnected() {
      return ctx.isConnected;
    },

    async connect(parent: Node, after?: Node) {
      // Don't run lifecycle hooks or initialize if already connected.
      // Calling connect again can be used to re-order elements that are already connected to the DOM.
      const wasConnected = ctx.isConnected;

      if (!wasConnected) {
        // Initialize an instance of the component
        await initialize(parent, after);
      }

      if (connectable) {
        await connectable.connect(parent, after);
      }

      if (!wasConnected) {
        // Run beforeConnected
        for (const callback of ctx.beforeConnectCallbacks) {
          await callback();
        }
        ctx.beforeConnectCallbacks = [];

        // Mark component as connected
        ctx.isConnected = true;

        // Run onConnected
        for (const callback of ctx.connectedCallbacks) {
          callback();
        }
        ctx.connectedCallbacks = [];
      }
    },

    async disconnect() {
      // Run beforeDisconnected
      for (const callback of ctx.beforeDisconnectCallbacks) {
        await callback();
      }
      ctx.beforeDisconnectCallbacks = [];

      // Disconnect component
      if (connectable) {
        await connectable.disconnect();
      }

      // Mark as disconnected
      ctx.isConnected = false;

      // Run onDisconnected
      for (const callback of ctx.disconnectedCallbacks) {
        callback();
      }
      ctx.disconnectedCallbacks = [];
    },
  };

  return controls;
}
