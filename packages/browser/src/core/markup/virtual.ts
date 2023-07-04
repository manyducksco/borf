import { AppContext, ElementContext } from "../App";
import { Readable, type ValuesOfReadables } from "../state.js";
import type { Renderable } from "../types";
import { deepEqual } from "../utils/deepEqual";
import { observeMany } from "../utils/observeMany.js";
import { DOMHandle, DOMMarkup, Markup, getRenderHandle, makeMarkup, renderMarkupToDOM, toMarkup } from "./index.js";

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

export function makeVirtual(config: VirtualConfig): DOMHandle {
  let isConnected = false;

  const node = document.createComment("virtual");
  const closingNode = document.createComment("/virtual");

  let currentItems: DOMMarkup[] = [];

  const observer = observeMany(config.readables, (...values) => {
    if (!isConnected) {
      return;
    }

    const renderable = config.render(...values);
    const nextItems = toMarkup(renderable);

    // Compare current and next items, patching where changes have occurred.

    patch(currentItems, nextItems)
      .then((patched) => {
        currentItems = patched;
      })
      .catch((error) => config.appContext.crashCollector.crash({ error, componentName: "virtual" }));
  });

  async function patch(current: DOMMarkup[], next: Markup[]) {
    const patched: DOMMarkup[] = [];
    const length = Math.max(current.length, next.length);

    for (let i = 0; i < length; i++) {
      if (!current[i] && next[i]) {
        // item was added
        patched[i] = createNode(next[i]);
        await patched[i].handle.connect(node.parentNode!, patched[i - 1]?.handle.node ?? node);
      } else if (current[i] && !next[i]) {
        // item was removed
        current[i].handle.disconnect();
      } else {
        if (current[i].type !== next[i].type) {
          // replace
          patched[i] = createNode(next[i]);
          current[i].handle.disconnect();
          await patched[i].handle.connect(node.parentNode!, patched[i - 1]?.handle.node ?? node);
        } else {
          const sameAttrs = deepEqual(current[i].attributes, next[i].attributes);

          if (sameAttrs) {
            // reuse element. the handle will do its own diffing to update children.
            const children = renderMarkupToDOM(next[i].children ?? [], {
              app: config.appContext,
              element: config.elementContext,
            });

            patched[i] = { ...current[i], children };
            patched[i].handle.setChildren(children);
          } else {
            // replace (TODO: patch attrs in place if possible)
            patched[i] = createNode(next[i]);
            current[i].handle.disconnect();
          }

          await patched[i].handle.connect(node.parentNode!, patched[i - 1]?.handle.node ?? node);
        }
      }
    }

    // Make sure closing <!--/virtual--> is at the end.
    const lastPatchedNode = patched[patched.length - 1]?.handle.node;
    if (!lastPatchedNode || closingNode.previousSibling !== lastPatchedNode) {
      node.parentNode!.insertBefore(closingNode, lastPatchedNode?.nextSibling || node.nextSibling || null);
    }

    return patched;
  }

  function createNode(markup: Markup): DOMMarkup {
    const handle = getRenderHandle(
      renderMarkupToDOM(markup, { app: config.appContext, element: config.elementContext })
    );

    return {
      ...markup,
      handle,
      children: markup.children?.map(createNode),
    };
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

        while (currentItems.length > 0) {
          // NOTE: Awaiting this disconnect causes problems when transitioning out old elements while new ones are transitioning in.
          // Not awaiting seems to fix this, but may cause problems with error handling or other render order things. Keep an eye on it.
          await currentItems.pop()?.handle.disconnect();
        }

        node.remove();
        closingNode.remove();
        isConnected = false;
      }
    },

    async setChildren() {
      console.warn("setChildren is not implemented for virtual()");
    },
  };
}

/*

Starting with the existing list of DOM nodes vs a newly constructed list of DOM nodes, recursively compare each node and children.

- If there is no DOM node at the same index:
  - Create and attach new DOM node.
- If there is a DOM node at the same index:
  - If the element type is different:
    - If both are HTML elements, replace the existing element with the new one but pass the same children (which may not need to be replaced). Diff children.
    - If the new element is a component, replace with an instance of the new component.
    - If types are different, replace.
  - If the element type is the same:
    - If HTML elements, update attributes and diff children.
    - If $special elements ($dynamic, $repeat, $text, $virtual):
      - If the attributes are equal, keep the old instance.
      - If the attributes are different, recreate the element.
    - If components:
      - If the attributes are equal, keep the old instance and set children.
      - If the attributes are different, recreate the component.

Q: How would keying by `id` work?

*/
