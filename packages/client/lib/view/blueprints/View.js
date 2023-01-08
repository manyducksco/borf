import { initView } from "../helpers/initView.js";

export class ViewBlueprint {
  constructor(fn, attributes, children) {
    this.fn = fn;
    this.attributes = attributes;
    this.children = children;
  }

  get isBlueprint() {
    return true;
  }

  build({ appContext, elementContext, attributes = {} }) {
    return initView(this.fn, {
      attributes: {
        ...this.attributes,
        ...attributes, // TODO: I'm not sure where these would be passed.
      },
      children: this.children,
      appContext,
      elementContext,
    });
  }
}
