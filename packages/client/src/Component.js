import { $Element } from "./$Element";
import { $Node } from "./$Node";

export class Component extends $Node {
  element;
  #dolla;

  app;
  http;
  attributes;
  children;

  static get isComponent() {
    return true;
  }

  set $(dolla) {
    this.#dolla = dolla;
  }

  constructor(attributes = {}, children = []) {
    super();

    this.attributes = attributes;
    this.children = children;
  }

  createElement() {
    let node = this.init(this.#dolla);

    if (node instanceof $Node) {
      console.log(node);

      return node.createElement();
    } else {
      throw new TypeError(
        `Component.init method returned ${typeof node} but should return an $Element`
      );
    }
  }
}
