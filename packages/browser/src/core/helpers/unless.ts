import type { Renderable } from "../types";

import { Dynamic } from "../classes/Dynamic.js";
import { Markup } from "../classes/Markup.js";
import { Readable } from "../classes/Readable.js";

/**
 * Displays `then` content when `value` holds a falsy value.
 */
export function unless(value: Readable<any>, then: Renderable): Markup {
  return new Markup({ type: "$dynamic", attributes: { value, otherwise: then }, children: null }, (config) => {
    return new Dynamic({
      ...config,
      readable: value,
      render: (value) => {
        if (!value) {
          return then;
        }

        return null;
      },
    });
  });
}
