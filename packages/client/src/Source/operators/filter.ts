import { Relay } from "../Source";
import { Listenable } from "../types";

/**
 * Forwards values only when the condition returns truthy for that value.
 *
 * @param source - Source from which to relay values.
 * @param condition - Function to decide whether to forward the value.
 */
export function filter<Type>(
  source: Listenable<Type>,
  condition: (value: Type) => boolean
) {
  return new Relay<Type>(source, (value, send) => {
    if (condition(value)) {
      send(value);
    }
  });
}
