import type { Renderable } from "../types";

import { Markup } from "../classes/Markup.js";
import { Readable, type ValuesOfReadables } from "../classes/Readable.js";

/**
 * Re-renders part of your view using virtual DOM when any value in `readables` changes.
 *
 * @param readables - An array of Readables to observe.
 * @param render - Takes the values of the Readables in the order they were passed, returning elements to display.
 */
export function virtual<R extends Readable<any>[]>(
  readables: [...R],
  render: (...values: ValuesOfReadables<R>) => Renderable
) {
  return new Markup({ type: "$virtual", attributes: { readables, render }, children: null }, (config) => {
    let isConnected = false;
    let node: Node;

    return {
      get isConnected() {
        return isConnected;
      },

      get node() {
        return node;
      },

      async connect(parent: Node, after?: Node) {},

      async disconnect() {},
    };
  });
}
