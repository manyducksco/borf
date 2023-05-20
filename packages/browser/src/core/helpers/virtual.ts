import type { Connectable, Renderable } from "../types";

import { Markup, makeMarkup, toMarkup } from "../markup.js";
import { Readable, type ValuesOfReadables } from "../classes/Readable.js";
import { observeMany } from "../utils/observeMany.js";
import { isFunction, isString } from "@borf/bedrock";
import { deepEqual } from "../utils/deepEqual";
import { AppContext, ElementContext } from "../classes/App";

type VNode = {
  markup: Markup;
  connectable: Connectable;
};

/**
 * Observes a readable value while this component is connected. Calls `render` each time the value changes.
 */
export function virtual<T>(readable: Readable<T>, render: (value: T) => Renderable): Markup;

/**
 * Observes a set of readable values while this component is connected.
 * Calls `render` with each value in the same order as `readables` each time any of their values change.
 */
export function virtual<T extends Readable<any>[]>(
  readables: [...T],
  render: (...values: ValuesOfReadables<T>) => Renderable
): Markup;

/**
 * Re-renders part of your view using virtual DOM when any value in `readables` changes.
 *
 * @param readables - An array of Readables to observe.
 * @param render - Takes the values of the Readables in the order they were passed, returning elements to display.
 */
export function virtual(readable: unknown, render: (...values: unknown[]) => Renderable): Markup {
  let readables: Readable<any>[] = [];

  if (!Array.isArray(readable)) {
    readables = [readable as Readable<any>];
  } else {
    readables = readable;
  }

  return makeMarkup("$virtual", { readables, render });
}

export interface VirtualConfig {
  readables: Readable<any>[];
  render: (...values: unknown[]) => Renderable;
  appContext: AppContext;
  elementContext: ElementContext;
}

export function makeVirtual(config: VirtualConfig) {
  let isConnected = false;

  const node = document.createComment(" virtual ");
  const closingNode = document.createComment(" /virtual ");

  let currentItems: VNode[] = [];

  const observer = observeMany(config.readables, (...values) => {
    if (!isConnected) {
      return;
    }

    const rendered = config.render(...values);
    const markup = toMarkup(rendered);

    patch(node, config, currentItems, markup).catch((error) =>
      config.appContext.crashCollector.crash({ error, componentName: "virtual" })
    );

    console.log(markup);
  });

  async function cleanup() {
    while (currentItems.length > 0) {
      // NOTE: Awaiting this disconnect causes problems when transitioning out old elements while new ones are transitioning in.
      // Not awaiting seems to fix this, but may cause problems with error handling or other render order things. Keep an eye on it.
      currentItems.pop()?.connectable.disconnect();
    }
  }

  // TODO: Actually diff. This is just destroying and recreating everything.
  // async function update(items: Markup[]) {
  //   await cleanup();

  //   const newItems: VNode[] = [];

  //   for (const markup of items) {
  //     const previous = currentItems[currentItems.length - 1]?.connectable.node || node;
  //     const connectable = markup.create(config);

  //     await connectable.connect(node.parentNode!, previous);

  //     newItems.push({ markup, connectable });
  //   }

  //   node.parentNode!.insertBefore(closingNode, newItems[currentItems.length - 1]?.connectable.node?.nextSibling);

  //   currentItems = newItems;
  // }

  async function patch(node: Node, config: VirtualConfig, currentItems: VNode[], items: Markup[]) {
    const length = Math.max(currentItems.length, items.length);

    const removedItems: VNode[] = [];
    const newItems: VNode[] = [];

    for (let i = 0; i < length; i++) {
      // Compare old item to new.

      console.log({ i, current: currentItems[i], next: items[i] });

      if (currentItems[i] && items[i]) {
        // TODO: Take `id` attribute into account to reuse items.
        if (currentItems[i].markup.type === items[i].type) {
          // Try to reuse existing element.

          if (deepEqual(currentItems[i].markup.attributes, items[i].attributes)) {
            // No changes needed if attributes are equal.
            // TODO: What about children?
            console.log("elements are equal");
            // await patch(currentItems[i].connectable.node, config, currentItems[i].markup.children ?? [], items[i].children);
          } else {
            const markup = items[i];

            if (isString(markup.type)) {
              // TODO: Patch HTML element. For now we replace.
              const connectable = markup.create(config);
              newItems[i] = { markup, connectable };
              removedItems.push(currentItems[i]);
            } else if (isFunction(markup.type)) {
              // Replace component.
              const connectable = markup.create(config);
              newItems[i] = { markup, connectable };
              removedItems.push(currentItems[i]);
            }
          }
        } else {
          // Replace item.
          const markup = items[i];
          const connectable = markup.create(config);
          newItems[i] = { markup, connectable };
          removedItems.push(currentItems[i]);
        }
      } else if (!currentItems[i] && items[i]) {
        // Add item.
        const markup = items[i];
        const connectable = markup.create(config);
        newItems[i] = { markup, connectable };
      } else if (currentItems[i] && !items[i]) {
        // Remove item.
        removedItems.push(currentItems[i]);
      }
    }

    currentItems = newItems;

    console.log({ removedItems, currentItems });

    for (const item of removedItems) {
      await item.connectable.disconnect();
    }

    for (const item of currentItems) {
      const previous = currentItems[currentItems.length - 1]?.connectable.node || node;

      await item.connectable.connect(node.parentNode!, previous);
    }
  }

  return {
    get connected() {
      return isConnected;
    },

    get node() {
      return node;
    },

    async connect(parent: Node, after?: Node) {
      const wasConnected = isConnected;

      parent.insertBefore(node, after ? after.nextSibling : null);
      isConnected = true;

      if (!wasConnected) {
        observer.start();
      }
    },

    async disconnect() {
      if (isConnected) {
        observer.stop();
        await cleanup();
        node.remove();
        closingNode.remove();
        isConnected = false;
      }
    },
  };
}

/*

Starting with the existing tree vs a newly constructed tree, recursively compare each node.

- If the element type is different:
  - If both are HTML elements, replace the existing element with the new one but pass the same children (which may not need to be replaced). Diff children.
  - If the new element is a component, replace with an instance of the new component.
  - If types are different, replace.
- If the element type is the same:
  - If HTML elements, update attributes and diff children.
  - If components:
    - If the component constructor is the same:
      - If the attributes are deep equal, keep the old instance. Update $$children.
      - If the attributes are different, recreate the component.

*/
