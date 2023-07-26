import { type AppContext, type ElementContext } from "./App.js";
import { type Readable, type StopFunction } from "./state.js";
import { type Renderable } from "./types.js";
import { type Markup, type DOMHandle, toMarkup, renderMarkupToDOM } from "./markup.js";

export interface ConditionalConfig {
  $predicate: Readable<any>;
  thenContent?: Renderable;
  elseContent?: Renderable;
  appContext: AppContext;
  elementContext: ElementContext;
}

export class Conditional implements DOMHandle {
  node: Node;
  endNode: Node;
  $predicate: Readable<any>;
  stopCallback?: StopFunction;
  thenContent?: Markup[];
  elseContent?: Markup[];
  connectedContent?: DOMHandle[];
  appContext: AppContext;
  elementContext: ElementContext;

  constructor(config: ConditionalConfig) {
    this.$predicate = config.$predicate;
    this.thenContent = config.thenContent ? toMarkup(config.thenContent) : undefined;
    this.elseContent = config.elseContent ? toMarkup(config.elseContent) : undefined;
    this.appContext = config.appContext;
    this.elementContext = config.elementContext;

    this.node = document.createComment("Conditional");
    this.endNode = document.createComment("/Conditional");
  }

  get connected() {
    return this.node.parentNode != null;
  }

  async connect(parent: Node, after?: Node | undefined) {
    if (!this.connected) {
      parent.insertBefore(this.node, after?.nextSibling ?? null);
      parent.insertBefore(this.endNode, this.node.nextSibling);

      this.stopCallback = this.$predicate.observe((value) => {
        this.update(value);
      });
    }
  }

  async disconnect() {
    if (this.stopCallback) {
      this.stopCallback();
      this.stopCallback = undefined;
    }

    if (this.connectedContent) {
      for (const handle of this.connectedContent) {
        handle.disconnect();
      }
      this.connectedContent = undefined;
    }

    if (this.connected) {
      this.node.parentNode?.removeChild(this.node);
      this.endNode.parentNode?.removeChild(this.endNode);
    }
  }

  async update(value: any) {
    if (this.connectedContent) {
      for (const handle of this.connectedContent) {
        await handle.disconnect();
      }
      this.connectedContent = undefined;
    }

    if (value && this.thenContent) {
      this.connectedContent = renderMarkupToDOM(this.thenContent, this);
    } else if (!value && this.elseContent) {
      this.connectedContent = renderMarkupToDOM(this.elseContent, this);
    }

    if (this.connectedContent) {
      for (let i = 0; i < this.connectedContent.length; i++) {
        const handle = this.connectedContent[i];
        const previous = this.connectedContent[i - 1]?.node ?? this.node;
        await handle.connect(this.node.parentNode!, previous);
      }
    }

    this.node.textContent = `Conditional (${value ? "truthy" : "falsy"})`;
  }

  async setChildren(children: DOMHandle[]): Promise<void> {}
}
