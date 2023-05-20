import { type ComponentContext } from "../component.js";
import { Markup } from "../classes/Markup.js";
import { Readable } from "../classes/Readable.js";
import { Repeat } from "../classes/Repeat.js";

/**
 * Renders once for each item in `values`. Dynamically adds and removes views as items change.
 * For complex objects with an ID, define a `key` function to select that ID.
 * Object identity (`===`) will be used for comparison if no `key` function is passed.
 *
 * TODO: Describe or link to docs where keying is explained.
 */
export function repeat<T>(
  readable: Readable<T[]>,
  render: ($value: Readable<T>, $index: Readable<number>, ctx: ComponentContext) => Markup | Markup[] | null,
  key?: (value: T, index: number) => string | number
): Markup {
  return new Markup({ type: "$repeat", attributes: { readable, render, key }, children: null }, (config) => {
    return new Repeat<T>({ ...config, readable, render, key });
  });
}
