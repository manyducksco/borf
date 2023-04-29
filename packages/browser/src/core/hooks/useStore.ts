import { type Store } from "../component.js";
import { type BuiltInStores } from "../types.js";
import { getCurrentComponent } from "../keys.js";

export function useStore<T extends Store<any, any>>(
  store: T
): ReturnType<T> extends Promise<infer U> ? U : ReturnType<T>;

export function useStore<N extends keyof BuiltInStores>(name: N): BuiltInStores[N];

/**
 * Returns the parent instance of `store`. Pass the store function to use a store, or pass the name to get a built-in store.
 */
export function useStore(store: keyof BuiltInStores | Store<any, any>) {
  const core = getCurrentComponent();
  return core.useStore(store as any);
}
