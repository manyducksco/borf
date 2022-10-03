import { initView } from "../helpers/initView.js";

export class ViewBlueprint {
  constructor(view, attributes, children) {
    this.view = view;
    this.attributes = attributes;
    this.children = children;
  }

  get isBlueprint() {
    return true;
  }

  build({ appContext, elementContext }) {
    return initView(this.view, {
      attributes: this.attributes,
      children: this.children,
      appContext,
      elementContext,
    });
  }
}