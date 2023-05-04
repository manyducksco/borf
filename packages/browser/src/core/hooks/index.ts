import { getCurrentComponent } from "../keys.js";
import { Readable, Writable, type ValuesOfReadables } from "../classes/Writable.js";
import { type Markup } from "../classes/Markup.js";
import { type Store } from "../component.js";
import { type BuiltInStores, type Read, type Write, type Value } from "../types.js";

/**
 * Sets the name of this component.
 */
export function useName(name: string) {
  const core = getCurrentComponent();
  core.setName(name);
}

/**
 * Sets loading content to be displayed while this component's setup is pending.
 * Only takes effect if this component function is async.
 */
export function useLoader(loader: Markup) {
  const core = getCurrentComponent();
  core.setLoader(loader);
}

/**
 * Returns a replacement for the global `console` object that prints messages tagged with the component's name.
 */
export function useConsole() {
  const core = getCurrentComponent();
  return core.debug;
}

/**
 * Returns a function that takes an error and triggers a crash to a page that displays that error.
 * The crash page itself can be customized for the app by passing a view to `App.setCrashView()`.
 */
export function useCrash() {
  const core = getCurrentComponent(); // Runs a check to throw an error if hook is used outside component scope.
  return core.crash;
}

/**
 * Runs `callback` and awaits its promise before `useConnected` callbacks are called.
 * Component is not considered connected until all `useBeforeConnect` promises resolve.
 */
export function useBeforeConnect(callback: () => Promise<any>) {
  const core = getCurrentComponent();
  core.beforeConnected(callback);
}

/**
 * Runs `callback` after this component is connected.
 */
export function useConnected(callback: () => any) {
  const core = getCurrentComponent();
  core.onConnected(callback);
}

/**
 * Runs `callback` and awaits its promise before `useDisconnected` callbacks are called.
 * Component is not removed from the DOM until all `useBeforeDisconnect` promises resolve.
 */
export function useBeforeDisconnect(callback: () => Promise<any>) {
  const core = getCurrentComponent();
  core.beforeDisconnected(callback);
}

/**
 * Runs `callback` after this component is disconnected.
 */
export function useDisconnected(callback: () => any) {
  const core = getCurrentComponent();
  core.onDisconnected(callback);
}

/**
 * Observes a readable value while this component is connected. Calls `callback` each time the value changes.
 */
export function useObserver<T>(readable: Readable<T>, callback: (value: T) => void): void;
/**
 * Observes a set of readable values while this component is connected.
 * Calls `callback` with each value in the same order as `readables` each time any of their values change.
 */
export function useObserver<T extends Readable<any>[], V>(
  readables: [...T],
  callback: (...values: ValuesOfReadables<T>) => void
): void;
export function useObserver(readable: any, callback: any) {
  const core = getCurrentComponent();
  return core.observe(readable, callback);
}

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
  const core = getCurrentComponent();
  return core.useStore(store as any);
}

/**
 * Returns the current value of an attribute.
 */
export function useValue<T>(value: Read<T>): Value<T>;
/**
 * Returns the current value of an attribute.
 */
export function useValue<T>(value?: Read<T>): Value<T | undefined>;
export function useValue<T>(value?: Read<T>): Value<T> {
  getCurrentComponent(); // Runs a check to throw an error if hook is used outside component scope.

  if (Readable.isReadable<T>(value)) {
    return value.value as Value<T>;
  } else {
    return value as Value<T>;
  }
}

/**
 * Returns a Readable binding to a Read or Write attribute.
 */
export function useReadable<T>(value: Read<T>): Readable<T>;
/**
 * Returns a Readable binding to a Read or Write attribute.
 */
export function useReadable<T>(value?: Read<T>): Readable<T | undefined>;
export function useReadable<T>(value?: Read<T>) {
  getCurrentComponent(); // Runs a check to throw an error if hook is used outside component scope.

  if (!Readable.isReadable<T>(value)) {
    return new Readable(value);
  } else {
    return value;
  }
}

/**
 * Returns a Writable binding to an attribute value. Changes to this writable will propagate to the original Writable.
 */
export function useWritable<T>(value: Write<T> | T): Writable<T>;
/**
 * Returns a Writable binding to an attribute value. Changes to this writable will propagate to the original Writable.
 */
export function useWritable<T>(value?: Write<T> | T): Writable<T | undefined>;
export function useWritable<T>(value?: Write<T> | T) {
  getCurrentComponent(); // Runs a check to throw an error if hook is used outside component scope.

  if (Writable.isWritable<T>(value)) {
    return value;
  } else if (Readable.isReadable<T>(value)) {
    throw new Error(`Value must be writable. Got: ${value}`);
  } else {
    return new Writable(value);
  }
}

/**
 * Merges the values of several Readables into one through a callback function of your design.
 * The resulting value will be stored the Readable returned by this function. Updates to source Readables
 * will generate a new value by calling your function again with the latest values.
 */
export function useMerge<R extends Readable<any>[], T>(
  readables: [...R],
  merge: (...values: ValuesOfReadables<R>) => T
): Readable<T> {
  getCurrentComponent(); // Runs a check to throw an error if hook is used outside component scope.

  return Readable.merge(readables, merge);
}
