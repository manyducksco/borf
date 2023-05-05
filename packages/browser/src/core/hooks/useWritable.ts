import { getCurrentContext } from "../component.js";
import { Readable } from "../classes/Readable.js";
import { Writable } from "../classes/Writable.js";
import { type Write } from "../types.js";

interface UseWritableOptions<T> {
  /**
   * The default value if `value` is undefined.
   */
  default: T;
}

/**
 * Returns a Writable binding to an attribute value. Changes to this writable will propagate to the original Writable.
 */
export function useWritable<T>(value: Write<T> | T): Writable<T>;
/**
 * Returns a Writable binding to an attribute value. Changes to this writable will propagate to the original Writable.
 */
export function useWritable<T>(value: Write<T> | T, options: UseWritableOptions<T>): Writable<T>;
/**
 * Returns a Writable binding to an attribute value. Changes to this writable will propagate to the original Writable.
 */
export function useWritable<T>(value?: Write<T> | T): Writable<T | undefined>;
/**
 * Returns a Writable binding to an attribute value. Changes to this writable will propagate to the original Writable.
 */
export function useWritable<T>(value: Write<T> | T | undefined, options: UseWritableOptions<T>): Writable<T>;
export function useWritable<T>(value?: Write<T> | T, options?: UseWritableOptions<T>) {
  getCurrentContext(); // Runs a check to throw an error if hook is used outside component scope.

  if (Writable.isWritable<T>(value)) {
    return value;
  } else if (Readable.isReadable<T>(value)) {
    throw new Error(`Value must be writable. Got: ${value}`);
  } else {
    if (value != null) {
      return new Writable(value);
    }

    return new Writable(options?.default);
  }
}
