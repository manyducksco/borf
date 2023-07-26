import type { Renderable } from "../types";

import { isArrayOf } from "@borf/bedrock";
import { isMarkup } from "../markup.js";
import { Readable } from "../state.js";

export function isRenderable(value: unknown): value is Renderable {
  return (
    value == null ||
    value === false ||
    typeof value === "string" ||
    typeof value === "number" ||
    isMarkup(value) ||
    Readable.isReadable(value) ||
    isArrayOf(isRenderable, value)
  );
}
