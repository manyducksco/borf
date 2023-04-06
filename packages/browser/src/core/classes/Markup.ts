import { Type } from "@borf/bedrock";
import { Connectable } from "./Connectable.js";
import { type AppContext, type ElementContext } from "./App.js";
import { type ViewConstructor, type ViewSetupFunction } from "./View.js";
import { type StoreConstructor } from "./Store.js";
import { type InputValues } from "./Inputs.js";
import { View } from "./View.js";
import { Text } from "./Text.js";
import { HTML } from "./HTML.js";
import { Readable } from "./Writable.js";

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
 * Creates markup nodes that can be displayed by a View.
 */
export type MarkupFunction = typeof m;

/**
 * DOM node factory. This is where things go to be converted into a Connectable.
 */
export class Markup<C extends MarkupConfig = MarkupConfig> {
  static isMarkup<C extends MarkupConfig = MarkupConfig>(value: unknown): value is Markup<C> {
    return value instanceof Markup;
  }

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

// TODO: Use JSX element types to suggest attributes.
// export function m<T extends keyof JSX.IntrinsicElements>(
//   tagname: T,
//   attributes?: JSX.IntrinsicElements[T],
//   ...children: Renderable[]
// ): Markup;

/**
 * Creates markup for a custom HTML element.
 */
export function m(tag: string, attributes?: any, ...children: (Renderable | Renderable[])[]): Markup;

/**
 * Creates markup for a View, as defined by a setup function.
 */
export function m<I>(
  setup: ViewSetupFunction<I>,
  inputs?: InputValues<I>,
  ...children: (Renderable | Renderable[])[]
): Markup;

/**
 * Creates markup for a View.
 */
export function m<I>(
  view: ViewConstructor<I>,
  inputs?: InputValues<I>,
  ...children: (Renderable | Renderable[])[]
): Markup;

/**
 * Creates markup for a Store.
 */
export function m<I, O extends object = {}>(
  store: StoreConstructor<I, O>,
  inputs?: InputValues<I>,
  ...children: (Renderable | Renderable[])[]
): Markup;

export function m<I, O extends object = {}>(
  element: string | ViewSetupFunction<I> | ViewConstructor<I> | StoreConstructor<I, O>,
  attributes?: InputValues<any>,
  ...children: (Renderable | Renderable[])[]
) {
  if (!children) {
    children = [];
  }

  if (!Type.isArray(children)) {
    children = [children];
  }

  // If attributes isn't null or an object, consider it a child.
  if (!Type.isObject(attributes)) {
    children.unshift(attributes as Renderable);
    attributes = {};
  }

  // Filter out falsy children and convert remaining ones to Markup instances.
  const formattedChildren = formatChildren(children.flat(Infinity) as Renderable[]);

  // Connectable objects like Views and Locals
  if (Connectable.isConnectable(element)) {
    const component = element as ViewConstructor<unknown> | StoreConstructor<unknown, any>;

    return new Markup((config) => {
      return new component({
        inputs: attributes,
        children: formattedChildren,
        ...config,
        label: config.label ?? component.label ?? component.name,
        about: config.about ?? component.about,
        inputDefs: component.inputs,
      });
    });
  }

  // HTML tag like "h1", "span"
  if (Type.isString(element)) {
    return new Markup((config) => new HTML({ attributes, children: formattedChildren, ...config, tag: element }));
  }

  // Anonymous view setup function.
  if (Type.isFunction(element)) {
    return new Markup(
      (config) => new View<any>({ ...config, children: formattedChildren, setup: element as ViewSetupFunction<any> })
    );
  }

  console.log({ element, attributes, children });
  throw new TypeError(`Unexpected arguments to m()`);
}

/**
 * Filters out falsy children and converts remaining ones to Markup instances.
 */
export function formatChildren(children: Renderable | Renderable[]): Markup[] {
  if (!Type.isArray(children)) {
    children = [children];
  }

  return children
    .flat(Infinity)
    .filter((x) => x !== null && x !== undefined && x !== false)
    .map((x) => {
      if (Markup.isMarkup(x)) {
        return x;
      }

      if (Type.isFunction(x)) {
        return new Markup((config) => new View({ ...config, setup: x as ViewSetupFunction<unknown> }));
      }

      if (Type.isString(x) || Type.isNumber(x) || Readable.isReadable(x)) {
        return new Markup((config) => new Text({ ...config, value: x }));
      }

      throw new TypeError(`Unexpected child type. Got: ${x}`);
    });
}
