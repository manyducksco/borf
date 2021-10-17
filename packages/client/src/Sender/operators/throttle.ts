import { Transmitter } from "../Transmitter";
import { Receiver, Sender } from "../../types";

/**
 * Returns a new Sender that ignores all values for `ms` milliseconds after a value is sent.
 *
 * @param source - a receiver
 * @param ms - amount of milliseconds to wait
 */
export const throttle = <T>(source: Sender<T> | Receiver<T>, ms: number) => {
  let next = 0;

  return new Transmitter<T, T>(source, (message, send) => {
    const now = Date.now();

    if (now >= next) {
      send(message);
      next = now + ms;
    }
  });
};
