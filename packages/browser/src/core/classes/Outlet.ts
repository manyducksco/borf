import { Type } from "@borf/bedrock";
import { Connectable } from "./Connectable.js";
import { formatChildren, Markup, type Renderable } from "./Markup.js";
import { Readable, type StopFunction } from "./Writable.js";
import { type AppContext, type ElementContext } from "./App.js";
import { isMarkup } from "../helpers/typeChecking.js";

// type Renderable = string | number | View<any> | Store<any>;

interface OutletOptions<T> {
  appContext: AppContext;
  elementContext: ElementContext;
  render?: (value: T) => Renderable;
  value?: T | Readable<T>;
}

function isRenderable(value: unknown): value is Renderable {
  return (
    value == null ||
    value === false ||
    typeof value === "string" ||
    typeof value === "number" ||
    isMarkup(value) ||
    Readable.isReadable(value)
  );
}

/**
 * Displays dynamic children without a parent element.
 */
export class Outlet<T> extends Connectable {
  #node = document.createComment("Outlet");
  #connectedViews: Connectable[] = [];
  #stopCallback?: StopFunction;
  #value;
  #render?: (value: T) => Renderable;
  #appContext;
  #elementContext;

  get node() {
    return this.#node;
  }

  constructor({ value, render, appContext, elementContext }: OutletOptions<T>) {
    super();

    this.#value = value;
    this.#appContext = appContext;
    this.#elementContext = elementContext;

    if (render) {
      this.#render = render;
    }
  }

  async connect(parent: Node, after?: Node) {
    if (this.isConnected) {
      await this.disconnect();
    }

    parent.insertBefore(this.node, after?.nextSibling ?? null);

    const update = (value: T) => {
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

      this.#update(newValue);
    };

    if (Readable.isReadable<T>(this.#value)) {
      this.#stopCallback = this.#value.observe(update);
    } else {
      update(this.#value!);
    }
  }

  async disconnect() {
    if (this.#stopCallback) {
      this.#stopCallback();
      this.#stopCallback = undefined;
    }

    if (this.isConnected) {
      this.#node.parentNode!.removeChild(this.node);
      this.#cleanup();
    }
  }

  setChildren(children: Renderable[]) {
    console.warn("Called setChildren on an outlet, which doesn't support setting children.");
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
      let previous = this.#connectedViews[this.#connectedViews.length - 1]?.node || this.node;
      let view =
        child instanceof Markup
          ? child.init({ appContext: this.#appContext, elementContext: this.#elementContext })
          : child;

      view.connect(this.#node.parentNode!, previous);

      this.#connectedViews.push(view);
    }
  }
}
