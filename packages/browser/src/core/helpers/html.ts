import type { IntrinsicElements, Renderable } from "../types";

import htm from "htm/mini";
import { isFunction, isString } from "@borf/bedrock";
import { makeComponent, type Component } from "../component.js";
import { HTML } from "../classes/HTML.js";
import { Markup, toMarkup } from "../classes/Markup.js";

interface MarkupFunction {
  <T extends keyof IntrinsicElements>(
    tag: T,
    attributes?: IntrinsicElements[T] | null,
    ...children: Renderable[]
  ): Markup;

  (tag: string, attributes?: Record<string, any> | null, ...children: Renderable[]): Markup;

  <I>(component: Component<I>, attributes?: I | null, ...children: Renderable[]): Markup;
}

/* ----- Code ----- */

/**
 * Creates markup nodes that can be returned from a View function and rendered to the DOM.
 *
 * @example
 * // Use components:
 * m(ExampleView, { inputOne: "value", inputTwo: 5 })
 *
 * // Create HTML elements:
 * m("span", { style: { color: "red" } }, "This text is red")
 * m("custom-element", null, "Child content", "Child content 2")
 */
export const m = <MarkupFunction>(<I>(element: string | Component<I>, attributes?: any, ...children: Renderable[]) => {
  // Filter out falsy children and convert remaining ones to Markup instances.
  const formattedChildren = toMarkup(children.flat(Infinity));

  // Components
  if (isFunction<Component<I>>(element)) {
    return new Markup({ type: element, attributes, children: formattedChildren }, (config) => {
      return makeComponent({
        ...config,
        component: element,
        children: formattedChildren,
        attributes: attributes,
      });
    });
  }

  // HTML tag like "h1", "span"
  if (isString(element)) {
    return new Markup(
      { type: element, attributes, children: formattedChildren },
      (config) => new HTML({ attributes, children: formattedChildren, ...config, tag: element })
    );
  }

  console.log({ element, attributes, children });
  throw new TypeError(`Unexpected arguments to m()`);
});

export const html = htm.bind(m);
