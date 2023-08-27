import { typeOf } from "@borf/bedrock";
import { type AppContext, type ElementContext } from "./App.js";
import { Readable } from "./state.js";
import type { Renderable } from "./types.js";
import { isRenderable } from "./utils/isRenderable.js";
import { observeMany } from "./utils/observeMany.js";
import { getRenderHandle, isDOMHandle, isMarkup, renderMarkupToDOM, toMarkup, type DOMHandle } from "./markup.js";

interface ObserverOptions {
  appContext: AppContext;
  elementContext: ElementContext;
  readables: Readable<any>[];
  renderFn: (...values: any) => Renderable;
}

/**
 * Displays dynamic children without a parent element.
 */
export class Observer implements DOMHandle {
  node: Node;
  endNode: Node;
  connectedViews: DOMHandle[] = [];
  renderFn: (...values: any) => Renderable;
  appContext;
  elementContext;
  observerControls;

  get connected() {
    return this.node.parentNode != null;
  }

  constructor({ readables, renderFn, appContext, elementContext }: ObserverOptions) {
    this.appContext = appContext;
    this.elementContext = elementContext;
    this.renderFn = renderFn;

    this.node = document.createComment("Observer");
    this.endNode = document.createComment("/Observer");

    this.observerControls = observeMany(readables, (...values) => {
      const rendered = this.renderFn(...values);

      if (!isRenderable(rendered)) {
        console.error(rendered);
        throw new TypeError(
          `Observer received invalid value to render. Got type: ${typeOf(rendered)}, value: ${rendered}`
        );
      }

      if (Array.isArray(rendered)) {
        this.update(...rendered);
      } else {
        this.update(rendered);
      }
    });
  }

  async connect(parent: Node, after?: Node) {
    if (!this.connected) {
      parent.insertBefore(this.node, after?.nextSibling ?? null);

      this.observerControls.start();
    }
  }

  async disconnect() {
    this.observerControls.stop();

    if (this.connected) {
      await this.cleanup();
      this.node.parentNode?.removeChild(this.node);
    }
  }

  async setChildren() {
    console.warn("setChildren is not implemented for Dynamic");
  }

  async cleanup() {
    while (this.connectedViews.length > 0) {
      // NOTE: Awaiting this disconnect causes problems when transitioning out old elements while new ones are transitioning in.
      // Not awaiting seems to fix this, but may cause problems with error handling or other render order things. Keep an eye on it.
      this.connectedViews.pop()?.disconnect();
    }
  }

  async update(...children: Renderable[]) {
    await this.cleanup();

    if (children == null || !this.connected) {
      return;
    }

    const handles: DOMHandle[] = children.map((c) => {
      if (isDOMHandle(c)) {
        return c;
      } else if (isMarkup(c)) {
        return getRenderHandle(renderMarkupToDOM(c, this));
      } else {
        return getRenderHandle(renderMarkupToDOM(toMarkup(c), this));
      }
    });

    for (const handle of handles) {
      const previous = this.connectedViews.at(-1)?.node || this.node;

      await handle.connect(this.node.parentNode!, previous);

      this.connectedViews.push(handle);
    }

    if (this.appContext.mode === "development") {
      const lastNode = this.connectedViews.at(-1)?.node;
      if (this.endNode.previousSibling !== lastNode) {
        this.node.parentNode!.insertBefore(this.endNode, lastNode?.nextSibling ?? null);
      }
    }
  }
}
