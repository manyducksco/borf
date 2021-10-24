import { Relay } from "../Relay";
import { Listenable } from "../types";

/**
 * Groups several messages and sends them as an array, either when the `size` is reached
 * or after `ms` milliseconds passes since the last message.
 *
 * @param source - Source from which to relay values.
 * @param size - Items to accumulate before sending the array.
 * @param wait - Milliseconds to wait before sending an incomplete array.
 */
export function batch<Type>(
  source: Listenable<Type>,
  size: number,
  wait: number
) {
  let timeout: any;
  let batch: Type[] = [];

  return new Relay<Type, Type[]>(source, (value, send) => {
    clearTimeout(timeout);

    batch.push(value);

    if (batch.length === size) {
      send(batch);
      batch = [];
    } else {
      timeout = setTimeout(() => {
        send(batch);
        batch = [];
      }, wait);
    }
  });
}
