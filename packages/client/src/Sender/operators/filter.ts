import { TransformFunc } from "../../types";

/**
 * Forwards values only when the condition returns truthy for that value.
 *
 * @param condition - function to decide whether to forward the message
 */
export function filter<T>(
  condition: (value: T) => boolean
): TransformFunc<T, T> {
  return (value, send) => {
    if (condition(value)) {
      send(value);
    }
  };
}
