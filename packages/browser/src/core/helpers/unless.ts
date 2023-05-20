import type { Renderable } from "../types";

import { Readable } from "../classes/Readable.js";
import { makeMarkup } from "../markup.js";

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
