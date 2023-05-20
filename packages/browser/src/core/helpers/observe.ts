import type { Renderable } from "../types";

import { Readable } from "../classes/Readable.js";
import { makeMarkup } from "../markup.js";

export function observe<T>(readable: Readable<T>, render: (value: T) => Renderable) {
  return makeMarkup("$dynamic", {
    value: readable,
    render,
  });
}
