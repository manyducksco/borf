import { isFunction, isObject, isString, isNumber, isTemplate, isView, isObservable } from "./helpers/typeChecking.js";
import { flatten } from "./helpers/flatten.js";
import { initView } from "./makers/initView.js";

import { Text } from "./views/Text.js";
import { Element } from "./views/Element.js";
import { Fragment } from "./views/Fragment.js";

/**
 * Template function. Used in components to render content.
 *
 * @example
 * h("div", { class: "active" }, "Text Content");
 * h("h1", "Text Content");
 * h(Component, { attribute: "value" }, "Child one", "Child two");
 * h(Component, v("h1", "H1 as child of component"));
 *
 * @param element - A tagname or component function.
 * @param args - Optional attributes object and zero or more children.
 */
export function h(element, ...args) {
  let attrs = {};

  if (isObject(args[0])) {
    attrs = args.shift();
  }

  return new Template(element, attrs, args);
}

export class Template {
  constructor(element, attrs, children) {
    this.element = element;
    this.attrs = attrs || {};
    this.children = children || [];
  }

  get isTemplate() {
    return true;
  }

  init({ appContext, elementContext = {} }) {
    elementContext = {
      ...elementContext,
    };

    // Mark this element and children as SVG. HTML and SVG require different functions
    // to create their nodes, and the Element component uses this to choose the correct one.
    if (!elementContext.isSVG && this.element === "svg") {
      elementContext.isSVG = true;
    }

    // Filter falsy children and convert to component instances.
    const children = flatten(this.children).filter((x) => x !== null && x !== undefined && x !== false);
    // .map((child) => {
    //   if (isTemplate(child)) {
    //     child = child.init({ appContext, elementContext });
    //   } else if (isString(child) || isNumber(child) || isObservable(child)) {
    //     child = initView(Text, {
    //       attrs: {
    //         value: child,
    //       },
    //       appContext,
    //     });
    //   }

    //   if (!isComponent(child)) {
    //     throw new TypeError(`Children must be components, strings, numbers or observables. Got: ${child}`);
    //   }

    //   return child;
    // });

    const { element, attrs } = this;

    if (isString(element)) {
      if (element === "" || element === "<>") {
        return initView(Fragment, { children, appContext, elementContext });
      } else {
        return initView(Element, {
          attrs: {
            tagname: element,
            attrs,
          },
          children,
          appContext,
          elementContext,
        });
      }
    } else if (isFunction(element)) {
      return initView(element, { attrs, children, appContext, elementContext });
    } else {
      console.error("Element", element);
      throw new TypeError(`Expected a tagname or component function. Got ${typeof element}`);
    }
  }
}
