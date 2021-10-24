import { Relay } from "../Relay";
import { Listenable } from "../types";

/**
 * Forwards values after `wait` milliseconds.
 *
 * @param source - Source from which to relay values.
 * @param wait - Milliseconds to wait before forwarding value.
 */
export function delay<Type>(source: Listenable<Type>, wait: number) {
  return new Relay<Type>(source, (value, send) => {
    setTimeout(() => {
      send(value);
    }, wait);
  });
}
