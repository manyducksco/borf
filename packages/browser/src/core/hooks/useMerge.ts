import { getCurrentContext } from "../component.js";
import { Readable, type ValuesOfReadables } from "../classes/Readable.js";

/**
 * Merges the values of several Readables into one through a callback function of your design.
 * The resulting value will be stored the Readable returned by this function. Updates to source Readables
 * will generate a new value by calling your function again with the latest values.
 */
export function useMerge<R extends Readable<any>[], T>(
  readables: [...R],
  merge: (...values: ValuesOfReadables<R>) => T
): Readable<T> {
  getCurrentContext(); // Runs a check to throw an error if hook is used outside component scope.

  return Readable.merge(readables, merge);
}
