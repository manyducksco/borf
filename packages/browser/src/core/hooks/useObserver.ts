import { getCurrentContext } from "../component.js";
import { Readable, type ValuesOfReadables, type StopFunction } from "../classes/Readable.js";

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
  const ctx = getCurrentContext();

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

  if (ctx.isConnected) {
    // If called when the component is connected, we assume this code is in a lifecycle hook
    // where it will be triggered at some point again after the component is reconnected.
    ctx.stopObserverCallbacks.push(start());
  } else {
    // This should only happen if called in the body of the setup function.
    // This code is not always re-run between when a component is disconnected and reconnected.
    ctx.connectedCallbacks.push(() => {
      ctx.stopObserverCallbacks.push(start());
    });
  }
}
