import { Relay } from "../Source";
import { Listenable } from "../types";

/**
 * Forwards the result of each value run through the `transform` function.
 *
 * @param source - Source from which to relay values.
 * @param transform - Function to transform values before forwarding.
 */
export function map<From, To>(
  source: Listenable<From>,
  transform: (value: From) => To
) {
  return new Relay<From, To>(source, (value, send) => {
    send(transform(value));
  });
}