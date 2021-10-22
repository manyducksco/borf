import { TransformFunc } from "../../types";

/**
 * Forwards the most recent message within `ms` milliseconds since the last value was sent.
 * All messages except the final one sent within that window are ignored.
 *
 * @param ms - amount of milliseconds to wait
 */
export function debounce<T>(ms: number): TransformFunc<T, T> {
  let timeout: any;

  return (value, send) => {
    clearTimeout(timeout);

    timeout = setTimeout(() => {
      send(value);
    }, ms);
  };
}
