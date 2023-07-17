import { typeOf } from "@borf/bedrock";
import { type AppContext, type ElementContext } from "../App.js";
import { Readable, type StopFunction } from "../state.js";
import type { Renderable } from "../types";
import { isRenderable } from "../utils/isRenderable.js";
import { getRenderHandle, renderMarkupToDOM, toMarkup, type DOMHandle } from "./index.js";

interface DynamicOptions<T> {
  appContext: AppContext;
  elementContext: ElementContext;
  readable: Readable<T>;
  render?: (value: T) => Renderable;
}

/**
 * Displays dynamic children without a parent element.
 */
export class Dynamic<T> implements DOMHandle {
  #node = document.createComment("Dynamic");
  #connectedViews: DOMHandle[] = [];
  #stopCallback?: StopFunction;
  #readable;
  #render?: (value: T) => Renderable;
  #appContext;
  #elementContext;

  get node() {
    return this.#node;
  }

  get connected() {
    return this.#node.parentNode != null;
  }

  constructor({ readable, render, appContext, elementContext }: DynamicOptions<T>) {
    this.#readable = readable;
    this.#appContext = appContext;
    this.#elementContext = elementContext;

    if (render) {
      this.#render = render;
    }
  }

  async connect(parent: Node, after?: Node) {
    if (!this.connected) {
      parent.insertBefore(this.node, after?.nextSibling ?? null);

      this.#stopCallback = this.#readable.observe((value: T) => {
        let newValue: unknown;

        if (this.#render) {
          newValue = this.#render(value);
        } else {
          newValue = value;
        }

        if (!isRenderable(newValue)) {
          console.error(newValue);
          throw new TypeError(
            `Dynamic received invalid value to render. Got type: ${typeOf(newValue)}, value: ${newValue}`
          );
        }

        if (Array.isArray(newValue)) {
          this.#update(...newValue);
        } else {
          this.#update(newValue);
        }
      });
    }
  }

  async disconnect() {
    if (this.#stopCallback) {
      this.#stopCallback();
      this.#stopCallback = undefined;
    }

    if (this.connected) {
      await this.#cleanup();
      this.#node.parentNode!.removeChild(this.#node);
    }
  }

  async setChildren() {
    console.warn("setChildren is not implemented for Dynamic");
  }

  async #cleanup() {
    while (this.#connectedViews.length > 0) {
      // NOTE: Awaiting this disconnect causes problems when transitioning out old elements while new ones are transitioning in.
      // Not awaiting seems to fix this, but may cause problems with error handling or other render order things. Keep an eye on it.
      this.#connectedViews.pop()?.disconnect();
    }
  }

  async #update(...children: Renderable[]) {
    console.log("updating", this.#readable.value, children);
    await this.#cleanup();

    if (children == null || !this.connected) {
      return;
    }

    const formattedChildren = toMarkup(children);

    for (const child of formattedChildren) {
      const previous = this.#connectedViews[this.#connectedViews.length - 1]?.node || this.node;
      const handle = getRenderHandle(
        renderMarkupToDOM(child, { appContext: this.#appContext, elementContext: this.#elementContext })
      );

      await handle.connect(this.node.parentNode!, previous);

      this.#connectedViews.push(handle);
    }
  }
}
