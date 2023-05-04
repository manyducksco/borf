import { typeOf } from "@borf/bedrock";
import { type Connectable } from "../types.js";
import { formatChildren, isRenderable, type Renderable } from "./Markup.js";
import { Readable, type StopFunction } from "./Readable.js";
import { type AppContext, type ElementContext } from "./App.js";

interface DynamicOptions<T> {
  appContext: AppContext;
  elementContext: ElementContext;
  readable: Readable<T>;
  render?: (value: T) => Renderable;
}

/**
 * Displays dynamic children without a parent element.
 */
export class Dynamic<T> implements Connectable {
  #node = document.createComment("Dynamic");
  #connectedViews: Connectable[] = [];
  #stopCallback?: StopFunction;
  #readable;
  #render?: (value: T) => Renderable;
  #appContext;
  #elementContext;

  get node() {
    return this.#node;
  }

  get isConnected() {
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
    if (this.isConnected) {
      // TODO: Handle errors
      await this.disconnect();
    }

    parent.insertBefore(this.node, after?.nextSibling ?? null);

    this.#stopCallback = this.#readable.observe((value: T) => {
      let newValue: unknown;

      if (this.#render) {
        newValue = this.#render(value);
      } else {
        newValue = value;
      }

      if (!isRenderable(newValue)) {
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

  async disconnect() {
    if (this.#stopCallback) {
      this.#stopCallback();
      this.#stopCallback = undefined;
    }

    if (this.isConnected) {
      this.#node.parentNode!.removeChild(this.#node);
      this.#cleanup();
    }
  }

  #cleanup() {
    while (this.#connectedViews.length > 0) {
      // TODO: Handle errors
      this.#connectedViews.pop()?.disconnect();
    }
  }

  #update(...children: Renderable[]) {
    this.#cleanup();

    if (children == null || !this.isConnected) {
      return;
    }

    const formattedChildren = formatChildren(children);

    for (const child of formattedChildren) {
      const previous = this.#connectedViews[this.#connectedViews.length - 1]?.node || this.node;
      const view = child.init({ appContext: this.#appContext, elementContext: this.#elementContext });

      // TODO: Handle errors
      view.connect(this.node.parentNode!, previous);

      this.#connectedViews.push(view);
    }
  }
}
