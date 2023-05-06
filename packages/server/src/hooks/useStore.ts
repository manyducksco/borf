import { getCurrentContext } from "../classes/App/makeRequestListener.js";
import { type Store } from "../component.js";

export function useStore<T extends Store<any, any>>(
  store: T
): ReturnType<T> extends Promise<infer U> ? U : ReturnType<T>;

export function useStore(store: Store<any, any>) {
  const { appContext } = getCurrentContext();

  // Fall back to app-lifecycle stores.
  if (appContext.stores.has(store)) {
    return appContext.stores.get(store)?.instance!.exports;
  }

  throw new Error(`Store '${store.name}' is not registered on this app.`);
}
