import type { Renderable } from "../types";

import { Dynamic } from "../classes/Dynamic.js";
import { Markup } from "../classes/Markup.js";
import { Readable } from "../classes/Readable.js";

export function observe<T>(readable: Readable<T>, render: (value: T) => Renderable): Markup {
  return new Markup({ type: "$dynamic", attributes: { value: readable, render }, children: null }, (config) => {
    return new Dynamic({ ...config, readable, render });
  });
}
