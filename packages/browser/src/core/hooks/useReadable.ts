import { getCurrentContext } from "../component.js";
import { Readable } from "../classes/Readable.js";
import { type Read } from "../types.js";

interface UseReadableOptions<T> {
  /**
   * The default value if `value` is undefined.
   */
  default: Exclude<T, undefined>;
}

/**
 * Returns a Readable binding to a Read or Write attribute.
 */
export function useReadable<T>(value: Read<T>): Readable<T>;
/**
 * Returns a Readable binding to a Read or Write attribute.
 */
export function useReadable<T>(value: Read<T>, options: UseReadableOptions<T>): Readable<Exclude<T, undefined>>;
/**
 * Returns a Readable binding to a Read or Write attribute.
 */
export function useReadable<T>(value?: Read<T>): Readable<T | undefined>;
/**
 * Returns a Readable binding to a Read or Write attribute.
 */
export function useReadable<T>(
  value: Read<T> | undefined,
  options: UseReadableOptions<T>
): Readable<Exclude<T, undefined>>;
export function useReadable<T>(value?: Read<T>, options?: UseReadableOptions<T>) {
  getCurrentContext(); // Runs a check to throw an error if hook is used outside component scope.

  if (Readable.isReadable<T>(value)) {
    return value;
  } else {
    if (value != null) {
      return new Readable(value);
    }

    return new Readable(options?.default);
  }
}
