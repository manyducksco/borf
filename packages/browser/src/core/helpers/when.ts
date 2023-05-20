import type { Renderable } from "../types";

import { Dynamic } from "../classes/Dynamic.js";
import { Markup } from "../classes/Markup.js";
import { Readable } from "../classes/Readable.js";

/**
 * Displays `then` content when `value` holds a truthy value. Displays `otherwise` content otherwise.
 */
export function when(value: Readable<any>, then?: Renderable, otherwise?: Renderable): Markup {
  return new Markup({ type: "$dynamic", attributes: { value, then, otherwise }, children: null }, (config) => {
    return new Dynamic({
      ...config,
      readable: value,
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
  });
}
