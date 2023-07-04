import { Readable } from "../state.js";
import type { Renderable } from "../types";
import { makeMarkup } from "./index.js";

export function observe<T>(readable: Readable<T>, render: (value: T) => Renderable) {
  return makeMarkup("$dynamic", {
    value: readable,
    render,
  });
}
