import { type StoreRegistration } from "./classes/App.js";
import { type Store } from "./component.js";
import { type BuiltInStores } from "./types.js";

// Components will set this before initializing and unset after initializing.
// This allows useStore to work in the context of a component, much like hooks in React.
export let CONTEXT: {
  appStores?: Map<keyof BuiltInStores | Store<any, any>, StoreRegistration>;
  localStores?: Map<Store<any, any>, StoreRegistration>;
} = { appStores: undefined, localStores: undefined };

/**
 * Returns an instance of a store.
 *
 * @param store - The store function to use.
 */
export function useStore<T extends Store<any, any>>(store: T): ReturnType<T>;

/**
 * Returns an instance of a store.
 *
 * @param store - The name of a built-in store.
 */
export function useStore<N extends keyof BuiltInStores>(name: N): BuiltInStores[N];

export function useStore(store: keyof BuiltInStores | Store<any, any>) {
  if (!CONTEXT.appStores || !CONTEXT.localStores) {
    throw new Error("useStore can only be called in the body of a component function.");
  }

  if (typeof store === "string") {
    store = store as keyof BuiltInStores;

    if (CONTEXT.appStores.has(store)) {
      const _store = CONTEXT.appStores.get(store)!;

      if (!_store.instance) {
        // appContext.crashCollector.crash({
        //   componentName,
        //   error: new Error(
        //     `Store '${store}' was accessed before it was set up. Make sure '${store}' is registered before components that access it.`
        //   ),
        // });

        throw new Error(
          `Store '${store}' was accessed before it was set up. Make sure '${store}' is registered before components that access it.`
        );
      }

      return _store.instance!.outputs;
    }
  } else {
    const name = store.name;

    if (CONTEXT.localStores.has(store)) {
      return CONTEXT.localStores.get(store)!.instance!.outputs;
    }

    if (CONTEXT.appStores.has(store)) {
      const _store = CONTEXT.appStores.get(store)!;

      if (!_store.instance) {
        // appContext.crashCollector.crash({
        //   componentName,
        //   error: new Error(
        //     `Store '${name}' was accessed before it was set up. Make sure '${name}' is registered before components that access it.`
        //   ),
        // });

        throw new Error(
          `Store '${name}' was accessed before it was set up. Make sure '${name}' is registered before components that access it.`
        );
      }

      return _store.instance!.outputs;
    }

    // appContext.crashCollector.crash({
    //   componentName,
    //   error: new Error(`Store '${name}' is not registered on this app.`),
    // });

    new Error(`Store '${name}' is not registered on this app.`);
  }
}
