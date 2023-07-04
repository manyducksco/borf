import { Readable, type StopFunction } from "../state.js";
import { type DOMHandle } from "./index.js";

interface Stringable {
  toString(): string;
}

interface TextOptions {
  value: Stringable | Readable<Stringable>;
}

export class Text implements DOMHandle {
  #node = document.createTextNode("");
  #value: Stringable | Readable<Stringable> = "";
  #stop?: StopFunction;

  get node() {
    return this.#node;
  }

  get connected() {
    return this.node.parentNode != null;
  }

  constructor({ value }: TextOptions) {
    this.#value = value;
  }

  #update(value?: Stringable) {
    if (value != null) {
      this.#node.textContent = value.toString();
    } else {
      this.#node.textContent = "";
    }
  }

  async connect(parent: Node, after: Node | null = null) {
    if (!this.connected) {
      if (Readable.isReadable<Stringable>(this.#value)) {
        this.#stop = this.#value.observe((value) => {
          this.#update(value);
        });
      } else {
        this.#update(this.#value);
      }
    }

    parent.insertBefore(this.#node, after?.nextSibling ?? null);
  }

  async disconnect() {
    if (this.connected) {
      if (this.#stop) {
        this.#stop();
      }

      this.#node.parentNode!.removeChild(this.#node);
    }
  }

  async setChildren() {}
}
