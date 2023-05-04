import { getCurrentContext } from "../component.js";
import { Readable } from "../classes/Readable.js";
import { type Read, type Value } from "../types.js";

/**
 * Returns the current value of an attribute.
 */
export function useValue<T>(value: Read<T>): Value<T>;
/**
 * Returns the current value of an attribute.
 */
export function useValue<T>(value?: Read<T>): Value<T | undefined>;
export function useValue<T>(value?: Read<T>): Value<T> {
  getCurrentContext(); // Runs a check to throw an error if hook is used outside component scope.

  if (Readable.isReadable<T>(value)) {
    return value.value as Value<T>;
  } else {
    return value as Value<T>;
  }
}
