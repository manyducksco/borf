import { Readable } from "../state.js";
import type { Renderable } from "../types";
import { makeMarkup } from "./index.js";

/**
 * Displays `then` content when `value` holds a truthy value. Displays `otherwise` content otherwise.
 */
export function when(value: Readable<any>, then?: Renderable, otherwise?: Renderable) {
  return makeMarkup("$dynamic", {
    value,
    render: (value) => {
      if (value) {
        return then;
      }

      if (otherwise) {
        return otherwise;
      }

      return null;
    },
  });
}
