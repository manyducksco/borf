import { Timer, Type } from "@borf/bedrock";
import { Connectable } from "./Connectable.js";
import { formatChildren, Markup, type Renderable } from "./Markup.js";
import { Readable, type StopFunction } from "./Writable.js";
import { type AppContext, type ElementContext } from "./App.js";

// type Renderable = string | number | View<any> | Store<any>;

interface OutletOptions<T> {
  appContext: AppContext;
  elementContext: ElementContext;
  readable: Readable<T>;
  render?: (value: T) => Renderable;
}

function isRenderable(value: unknown): value is Renderable {
  return (
    value == null ||
    value === false ||
    typeof value === "string" ||
    typeof value === "number" ||
    Markup.isMarkup(value) ||
    Readable.isReadable(value) ||
    Type.isArrayOf(isRenderable, value)
  );
}

/**
 * Displays dynamic children without a parent element.
 */
export class Outlet<T> extends Connectable {
  #node = document.createComment("Outlet");
  #connectedViews: Connectable[] = [];
  #stopCallback?: StopFunction;
  #readable;
  #render?: (value: T) => Renderable;
  #appContext;
  #elementContext;
  #logger;

  get node() {
    return this.#node;
  }

  constructor({ readable, render, appContext, elementContext }: OutletOptions<T>) {
    super();

    this.#readable = readable;
    this.#appContext = appContext;
    this.#elementContext = elementContext;
    this.#logger = appContext.debugHub.logger("outlet");

    if (render) {
      this.#render = render;
    }
  }

  async connect(parent: Node, after?: Node) {
    if (this.isConnected) {
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
          `Outlet received invalid value to render. Got type: ${Type.of(newValue)}, value: ${newValue}`
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

  setChildren(children: Renderable[]) {
    // If this is ever called, the framework is broken.
    throw new Error(`setChildren is not supported for Outlets because they get their contents from a Readable`);
  }

  #cleanup() {
    while (this.#connectedViews.length > 0) {
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

      view.connect(this.node.parentNode!, previous);

      this.#connectedViews.push(view);
    }
  }
}
