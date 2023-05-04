import { type Store, getCurrentContext } from "../component.js";
import { type BuiltInStores } from "../types.js";

/**
 * Returns the nearest parent instance or app instance of `store`.
 */
export function useStore<T extends Store<any, any>>(
  store: T
): ReturnType<T> extends Promise<infer U> ? U : ReturnType<T>;
/**
 * Returns an instance of a built-in store.
 */
export function useStore<N extends keyof BuiltInStores>(name: N): BuiltInStores[N];
export function useStore(store: keyof BuiltInStores | Store<any, any>) {
  const ctx = getCurrentContext();
  let name: string;

  if (typeof store === "string") {
    name = store as keyof BuiltInStores;

    if (ctx.appContext.stores.has(store)) {
      const _store = ctx.appContext.stores.get(store)!;

      if (!_store.instance) {
        ctx.appContext.crashCollector.crash({
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

    if (ctx.elementContext.stores.has(store)) {
      return ctx.elementContext.stores.get(store)!.instance!.outputs;
    }

    if (ctx.appContext.stores.has(store)) {
      const _store = ctx.appContext.stores.get(store)!;

      if (!_store.instance) {
        ctx.appContext.crashCollector.crash({
          componentName: ctx.name,
          error: new Error(
            `Store '${name}' was accessed before it was set up. Make sure '${name}' is registered before components that access it.`
          ),
        });
      }

      return _store.instance!.outputs;
    }
  }

  ctx.appContext.crashCollector.crash({
    componentName: ctx.name,
    error: new Error(`Store '${name}' is not registered on this app.`),
  });
}
