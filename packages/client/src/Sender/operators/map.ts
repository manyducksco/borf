import { Receiver, Sender } from "../../types";
import { Relay } from "../Relay";

/**
 * Returns a new Sender that forwards the result of the `transform` function for each value.
 *
 * @param source - a receiver or sender to pull values from
 * @param transform - function to transform value from receiver
 */
export const map = <I, O>(
  source: Receiver<I> | Sender<I>,
  transform: (value: I) => O
) =>
  new Relay<I, O>(source, (value, send) => {
    send(transform(value));
  });
