import { Readable, type ValuesOfReadables, type StopFunction } from "../classes/Readable.js";

type ObserverControls = {
  start: () => void;
  stop: () => void;
};

/**
 * Observes a readable value while this component is connected. Calls `callback` each time the value changes.
 */
export function observeMany<T>(readable: Readable<T>, callback: (value: T) => void): ObserverControls;

/**
 * Observes a set of readable values while this component is connected.
 * Calls `callback` with each value in the same order as `readables` each time any of their values change.
 */
export function observeMany<T extends Readable<any>[], V>(
  readables: [...T],
  callback: (...values: ValuesOfReadables<T>) => void
): ObserverControls;

/**
 * Observes one or more readables. Returns an object with start and stop methods.
 */
export function observeMany(readable: any, callback: any) {
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

  let _stop: StopFunction | undefined;

  return {
    start() {
      if (!_stop) {
        if (readables.length > 1) {
          _stop = Readable.merge(readables, callback).observe(() => {});
        } else {
          _stop = readables[0].observe(callback);
        }
      }
    },
    stop() {
      if (_stop) {
        _stop();
        _stop = undefined;
      }
    },
  };
}
