import { getCurrentContext } from "../component.js";
import { Readable } from "../classes/Readable.js";
import { type Read, type Value } from "../types.js";

interface UseValueOptions<T> {
  /**
   * The default value if `value` is undefined.
   */
  default: T;
}

/**
 * Returns the current value of an attribute.
 */
export function useValue<T>(value: Read<T>): Value<T>;
/**
 * Returns the current value of an attribute.
 */
export function useValue<T>(value: Read<T>, options: UseValueOptions<T>): Value<Exclude<T, undefined>>;
/**
 * Returns the current value of an attribute.
 */
export function useValue<T>(value?: Read<T>): Value<T | undefined>;
/**
 * Returns the current value of an attribute.
 */
export function useValue<T>(value: Read<T> | undefined, options: UseValueOptions<T>): Value<Exclude<T, undefined>>;
export function useValue<T>(value?: Read<T>, options?: UseValueOptions<T>) {
  getCurrentContext(); // Runs a check to throw an error if hook is used outside component scope.

  if (Readable.isReadable<T>(value)) {
    return value.value;
  } else {
    if (value != null) {
      return value;
    }

    return options?.default;
  }
}
