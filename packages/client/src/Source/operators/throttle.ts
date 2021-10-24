import { Relay } from "../Relay";
import { Listenable } from "../types";

/**
 * Ignores all values sent for `ms` milliseconds after a value is sent.
 *
 * @param source - Source from which to relay values.
 * @param wait - Milliseconds to wait before accepting values again.
 */
export function throttle<Type>(source: Listenable<Type>, wait: number) {
  let next = 0;

  return new Relay<Type>(source, (value, send) => {
    const now = Date.now();

    if (now >= next) {
      send(value);
      next = now + wait;
    }
  });
}
