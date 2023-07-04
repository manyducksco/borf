import { Readable } from "../state.js";
import type { Renderable } from "../types";
import { makeMarkup } from "./index.js";

/**
 * Displays `then` content when `value` holds a falsy value.
 */
export function unless(value: Readable<any>, then: Renderable) {
  return makeMarkup("$dynamic", {
    value,
    render: (value) => {
      if (!value) {
        return then;
      }

      return null;
    },
  });
}
