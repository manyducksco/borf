import { type AppContext } from "./classes/App/App.js";
import { type DebugChannel } from "./classes/DebugHub.js";

export type Store<A, E> = (attributes: A, context: ComponentContext) => E | Promise<E>;

export interface ComponentContext extends DebugChannel {
  name: string;
  getStore<T extends Store<any, any>>(store: T): ReturnType<T> extends Promise<infer U> ? U : ReturnType<T>;
}

/**
 * Parameters passed to the makeStore function.
 */
interface StoreConfig<A> {
  appContext: AppContext;
  store: Store<A, any>;
  attributes: A;
}

/**
 * Methods for the framework to manipulate a store.
 */
export interface StoreControls {
  exports?: object;
  connect(): Promise<void>;
}

export function makeStore<A>(config: StoreConfig<A>): StoreControls {
  let output: object | undefined;

  const context: Omit<ComponentContext, keyof DebugChannel> = {
    name: config.store.name ?? "anonymous",
    getStore<T extends Store<any, any>>(store: T): ReturnType<T> extends Promise<infer U> ? U : ReturnType<T> {
      if (config.appContext.stores.has(store)) {
        return config.appContext.stores.get(store)?.instance!.exports as any;
      }

      throw new Error(`Store '${store.name}' is not registered on this app.`);
    },
  };

  const debugChannel = config.appContext.debugHub.channel({
    get name() {
      return context.name;
    },
  });

  Object.defineProperties(context, Object.getOwnPropertyDescriptors(debugChannel));

  const controls: StoreControls = {
    get exports() {
      return output;
    },

    async connect() {
      output = config.store(config.attributes, context as ComponentContext);

      if (output instanceof Promise) {
        output = await output;
      }
    },
  };

  return controls;
}
