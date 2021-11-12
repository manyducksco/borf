import { $Element } from "./$Element";
import { $Node } from "./$Node";

export class Component extends $Node {
  static get isComponent() {
    return true;
  }

  element;
  #dolla;

  set $(dolla) {
    this.#dolla = dolla;
  }

  app;
  http;
  attributes;
  children;

  constructor(attributes = {}, children = []) {
    super();

    this.attributes = attributes;
    this.children = children;
  }

  init() {
    throw new Error(`Component needs an 'init' method`);
  }

  createElement() {
    let node = this.init(this.#dolla);

    if (node instanceof $Node) {
      console.log(node);

      return node.createElement();
    } else {
      throw new Error(
        `Component 'init' method must return an $(element). Received: ${typeof node}`
      );
    }
  }
}
