import type { Renderable } from "../types";

import { isArrayOf } from "@borf/bedrock";
import { Markup } from "../classes/Markup.js";
import { Readable } from "../classes/Readable.js";

export function isRenderable(value: unknown): value is Renderable {
  return (
    value == null ||
    value === false ||
    typeof value === "string" ||
    typeof value === "number" ||
    Markup.isMarkup(value) ||
    Readable.isReadable(value) ||
    isArrayOf(isRenderable, value)
  );
}
