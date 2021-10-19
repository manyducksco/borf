import { TransformFunc } from "../../types";

/**
 * Groups several values and sends them as an array, either when the `size` is reached
 * or after `ms` milliseconds passes since the last message.
 *
 * @param size - Amount of items to accumulate before sending the array.
 * @param ms - Amount of milliseconds to wait before sending an incomplete array.
 */
export function batch<T>(size: number, ms: number): TransformFunc<T, T[]> {
  let timeout: any;
  let batch: T[] = [];

  return (message, send) => {
    clearTimeout(timeout);

    batch.push(message);

    if (batch.length === size) {
      send(batch);
      batch = [];
    } else {
      timeout = setTimeout(() => {
        send(batch);
        batch = [];
      }, ms);
    }
  };
}
