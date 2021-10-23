import { Receivable, Relay } from "..";

/**
 * Forwards the most recent value after values stop being received for `ms` milliseconds.
 *
 * @param source - Source from which to relay values.
 * @param wait - Milliseconds to wait from last value.
 * @param immediate - Forward value immediately if time since last value is more than `wait` ms.
 */
export function debounce<T>(
  source: Receivable<T>,
  wait: number,
  immediate: boolean = false
) {
  let timeout: any;

  return new Relay<T, T>(source, (value, send) => {
    clearTimeout(timeout);

    if (immediate && !timeout) {
      send(value);
    }

    timeout = setTimeout(() => {
      timeout = null;

      if (!immediate) {
        send(value);
      }
    }, wait);
  });
}
