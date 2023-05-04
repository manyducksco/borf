import { getCurrentContext } from "../component.js";
import { Readable } from "../classes/Readable.js";
import { type Read } from "../types.js";

/**
 * Returns a Readable binding to a Read or Write attribute.
 */
export function useReadable<T>(value: Read<T>): Readable<T>;
/**
 * Returns a Readable binding to a Read or Write attribute.
 */
export function useReadable<T>(value?: Read<T>): Readable<T | undefined>;
export function useReadable<T>(value?: Read<T>) {
  getCurrentContext(); // Runs a check to throw an error if hook is used outside component scope.

  if (!Readable.isReadable<T>(value)) {
    return new Readable(value);
  } else {
    return value;
  }
}
