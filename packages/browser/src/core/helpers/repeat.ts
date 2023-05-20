import { type ComponentContext } from "../component.js";
import { Markup, makeMarkup } from "../markup.js";
import { Readable } from "../classes/Readable.js";

/**
 * Renders once for each item in `values`. Dynamically adds and removes views as items change.
 * For complex objects with an ID, define a `key` function to select that ID.
 * Object identity (`===`) will be used for comparison if no `key` function is passed.
 *
 * TODO: Describe or link to docs where keying is explained.
 */
export function repeat<T>(
  value: Readable<T[]>,
  render: ($value: Readable<T>, $index: Readable<number>, ctx: ComponentContext) => Markup | Markup[] | null,
  key?: (value: T, index: number) => string | number
): Markup {
  return makeMarkup("$repeat", { value, render, key });
}
