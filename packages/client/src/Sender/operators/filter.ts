import { Transmitter } from "../Transmitter";
import { Sender, Receiver } from "../../types";

/**
 * Returns a new Sender that forwards values only when the condition returns truthy for that value.
 *
 * @param receiver - a receiver
 * @param condition - function to decide whether to forward the message
 */
export const filter = <T>(
  source: Sender<T> | Receiver<T>,
  condition: (value: T) => boolean
) => {
  return new Transmitter<T, T>(source, (value, send) => {
    if (condition(value)) {
      send(value);
    }
  });
};
