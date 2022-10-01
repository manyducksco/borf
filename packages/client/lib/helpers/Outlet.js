import { isArray, isFunction, isNumber, isObservable, isString, isTemplate } from "./typeChecking.js";
import { Template } from "../h.js";
import { Text } from "../views/Text.js";

/**
 * Wraps a binding in a view.
 */
export class Outlet {
  constructor(binding, render) {
    this.binding = binding;
    this.render = render || ((x) => x);
  }

  get isTemplate() {
    return true;
  }

  init({ appContext, elementContext }) {
    return new OutletView(this.binding, this.render, { appContext, elementContext });
  }
}

class OutletView {
  constructor(binding, render, { appContext, elementContext }) {
    this.node = document.createTextNode("");
    this.binding = binding;
    this.render = render;
    this.appContext = appContext;
    this.elementContext = elementContext;
    this.connectedViews = [];
  }

  get isView() {
    return true;
  }

  get isConnected() {
    return this.node.parentNode != null;
  }

  _unrender() {
    while (this.connectedViews.length > 0) {
      this.connectedViews.pop().disconnect();
    }
  }

  _render(value) {
    if (value == null) {
      return this._unrender();
    }

    let rendered = this.render ? this.render(value) : value;
    let elements = [];
    let views = [];

    // Render function returned a function (that should return an element).
    if (rendered && isFunction(rendered)) {
      rendered = rendered();
    }

    // Render function didn't return anything.
    if (rendered === undefined) {
      throw new TypeError(`Outlet: render function returned undefined.`);
    }

    // Render function explicitly returned null.
    if (rendered === null) {
      return this._unrender();
    }

    if (!isArray(rendered)) {
      elements.push(rendered);
    } else {
      elements.push(...rendered);
    }

    for (let item of elements) {
      if (isString(item) || isNumber(item) || isObservable(item)) {
        item = new Template(Text, { value: item });
      }

      if (isTemplate(item)) {
        item = item.init({ appContext: this.appContext, elementContext: this.elementContext });
      }

      if (!item.isView) {
        throw new TypeError(
          `Outlet: value must be an element, object with a '.toString()' method, or null. Got: ${item}`
        );
      }

      views.push(item);
    }

    this._unrender();

    for (const view of views) {
      // Insert each view after the previous one.
      let previous = this.connectedViews[this.connectedViews.length - 1]?.node || this.node;

      view.connect(this.node.parentNode, previous);

      this.connectedViews.push(view);
    }
  }

  setChildren(...args) {}

  connect(parent, after = null) {
    parent.insertBefore(this.node, after?.nextSibling);
    this.subscription = this.binding.subscribe((value) => {
      // TODO: Figure out why we have to use setTimeout to get the elements to render in the correct order the first time (correct on subsequent renders).
      setTimeout(() => {
        this._render(value);
      });
    });
  }

  disconnect() {
    this.subscription.unsubscribe();
    this._unrender();
  }
}
