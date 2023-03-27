import type { Connectable } from "./Connectable";
import type { AppContext, ElementContext } from "./App";
import type { ViewConstructor, ViewSetupFunction } from "./View";
import type { StoreConstructor } from "./Store";
import type { InputValues } from "./Inputs.js";

import { Type } from "@borf/bedrock";
import { flatten } from "../helpers/flatten.js";
import { isConnectable } from "../helpers/typeChecking.js";
import { View } from "./View.js";
import { Text } from "./Text.js";
import { HTML } from "./HTML.js";

export interface MarkupConfig {
  appContext: AppContext;
  elementContext: ElementContext;
  label?: string;
  about?: string;
}

/**
 * Represents everything that can be handled as a DOM node.
 * These are all the items considered valid to pass as children to any element.
 */
export type Renderable = string | number | Markup | false | null | undefined;

/**
 * DOM node factory. This is where things go to be converted into a Connectable.
 */
export class Markup<C extends MarkupConfig = MarkupConfig> {
  #setup;

  constructor(setup: (config: C) => Connectable) {
    this.#setup = setup;
  }

  init(config: C) {
    return this.#setup(config);
  }
}

/**
 * Creates markup for an HTML element.
 */
// export function m<T extends string>(
//   tagname: T,
//   attributes?: JSX.IntrinsicElements[T],
//   ...children: Renderable[]
// ): Markup;

/**
 * Creates markup for a custom HTML element.
 */
export function m(tagname: string, attributes?: any, ...children: Renderable[]): Markup;

/**
 * Creates markup for a View, as defined by a setup function.
 */
export function m<I>(setup: ViewSetupFunction<I>, inputs?: InputValues<I>, ...children: Renderable[]): Markup;

/**
 * Creates markup for a View.
 */
export function m<I>(view: ViewConstructor<I>, inputs?: InputValues<I>, ...children: Renderable[]): Markup;

/**
 * Creates markup for a Store.
 */
export function m<I, O>(store: StoreConstructor<I, O>, inputs?: InputValues<I>, ...children: Renderable[]): Markup;

export function m<I, O>(
  element: string | ViewSetupFunction<I> | ViewConstructor<I> | StoreConstructor<I, O>,
  attributes?: InputValues<any>,
  ...children: Renderable[]
) {
  // If attributes isn't null or an object, consider it a child.
  if (!Type.isObject(attributes)) {
    children.unshift(attributes);
    attributes = {};
  }

  // Filter out falsy children and convert remaining ones to Markup instances.
  children = formatChildren(children);

  // Connectable objects like Views and Locals
  if (isConnectable(element)) {
    return new Markup((config) => {
      return new element({
        inputs: attributes,
        children,
        ...config,
        label: config.label ?? element.label ?? element.name,
        about: config.about ?? element.about,
        inputDefs: element.inputs,
      });
    });
  }

  // HTML tag like "h1", "span"
  if (Type.isString(element)) {
    return new Markup((config) => new HTML({ attributes, children, ...config, tag: element }));
  }

  // Anonymous view setup function.
  if (Type.isFunction(element)) {
    return new Markup((config) => new View<any>({ ...config, setup: element }));
  }

  console.log({ element, attributes, children });
  throw new TypeError(`Unexpected arguments to m()`);
}

/**
 * Filter out falsy children and convert remaining ones to Markup instances.
 */
export function formatChildren(children: unknown[]) {
  if (!Type.isArray(children)) {
    children = [children];
  }

  return flatten(children)
    .filter((x) => x !== null && x !== undefined && x !== false)
    .map((x) => {
      if (x instanceof Markup) {
        return x;
      }

      if (Type.isFunction(x)) {
        return new Markup((config) => new View({ ...config, setup: x }));
      }

      if (Type.isString(x) || Type.isNumber(x) || Type.isObservable(x)) {
        return new Markup((config) => new Text({ ...config, value: x }));
      }

      console.trace(x);

      throw new TypeError(`Unexpected child type. Got: ${x}`);
    });
}
