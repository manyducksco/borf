import { Transmitter } from "../Transmitter";
import { Receiver, Sender } from "../../types";

/**
 * Returns a new Sender that groups several values and sends them as an array, either when
 * the `size` is reached or `timeout` milliseconds passes since the last message.
 *
 * @param source - Sender or Receiver from which to forward messages.
 * @param size - Amount of items to accumulate before sending the array.
 * @param ms - Amount of milliseconds to wait before sending an incomplete array.
 */
export const batch = <T>(
  source: Sender<T> | Receiver<T>,
  size: number,
  ms: number
) => {
  let timeout: any;
  let batch: T[] = [];

  return new Transmitter<T, T[]>(source, (value, send) => {
    clearTimeout(timeout);

    batch.push(value);

    if (batch.length === size) {
      send(batch);
      batch = [];
    } else {
      timeout = setTimeout(() => {
        send(batch);
        batch = [];
      }, ms);
    }
  });
};
