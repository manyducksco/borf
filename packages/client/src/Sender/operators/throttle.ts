import { TransformFunc } from "../../types";

/**
 * Ignores all messages for `ms` milliseconds after a value is sent.
 *
 * @param ms - amount of milliseconds to wait
 */
export function throttle<T>(ms: number): TransformFunc<T, T> {
  let next = 0;

  return (message, send) => {
    const now = Date.now();

    if (now >= next) {
      send(message);
      next = now + ms;
    }
  };
}
