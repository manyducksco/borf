import { initLocal } from "../../local/helpers/initLocal.js";

export class LocalBlueprint {
  constructor(fn, attributes, children) {
    this.fn = fn;
    this.attributes = attributes;
    this.children = children;
  }

  get isBlueprint() {
    return true;
  }

  build({ appContext, elementContext }) {
    return initLocal({
      appContext,
      elementContext,
      fn: this.fn,
      attributes: this.attributes,
      children: this.children,
    });
  }
}
