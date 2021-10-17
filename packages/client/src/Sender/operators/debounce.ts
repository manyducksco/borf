import { Transmitter } from "../Transmitter";
import { Receiver, Sender } from "../../types";

/**
 * Returns a new Sender that forwards the most recent value within `ms` milliseconds
 * since the last value was sent. All other values sent within that window are ignored.
 *
 * @param receiver - a receiver
 * @param ms - amount of milliseconds to wait
 */
export const debounce = <T>(source: Sender<T> | Receiver<T>, ms: number) => {
  let timeout: any;

  return new Transmitter<T>(source, (value, send) => {
    clearTimeout(timeout);

    timeout = setTimeout(() => {
      send(value);
    }, ms);
  });
};
