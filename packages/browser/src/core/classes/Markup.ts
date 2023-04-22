import { Type } from "@borf/bedrock";
import { Connectable } from "./Connectable.js";
import { type AppContext, type ElementContext } from "./App.js";
import { Text } from "./Text.js";
import { HTML } from "./HTML.js";
import { Readable } from "./Writable.js";
import { Repeat, type RepeatContext } from "./Repeat.js";
import { Outlet } from "./Outlet.js";
import { makeComponent, type Component } from "../scratch.js";

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
export type Renderable = string | number | Markup | false | null | undefined | Readable<any>;

/**
 * Creates markup nodes that can be displayed by a View.
 */
export type MarkupFunction = typeof m;

/**
 * DOM node factory. This is where things go to be converted into a Connectable.
 */
export class Markup {
  static isMarkup(value: unknown): value is Markup {
    return value instanceof Markup;
  }

  #setup;

  constructor(setup: (config: MarkupConfig) => Connectable) {
    this.#setup = setup;
  }

  init(config: MarkupConfig) {
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
 * Creates markup for a component.
 */
export function m<I>(component: Component<I>, inputs?: I, ...children: (Renderable | Renderable[])[]): Markup;

export function m<I>(element: string | Component<I>, attributes?: any, ...children: (Renderable | Renderable[])[]) {
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

  // Components
  if (Type.isFunction<Component<I>>(element)) {
    return new Markup((config) => {
      return makeComponent({
        ...config,
        component: element,
        children: formattedChildren,
        inputs: attributes,
      });
    });
  }

  // HTML tag like "h1", "span"
  if (Type.isString(element)) {
    return new Markup((config) => new HTML({ attributes, children: formattedChildren, ...config, tag: element }));
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

      if (Type.isString(x) || Type.isNumber(x) || Readable.isReadable(x)) {
        return new Markup((config) => new Text({ ...config, value: x }));
      }

      throw new TypeError(`Unexpected child type. Got: ${x}`);
    });
}

/**
 * Takes a Readable `value` and displays `then` content when `value` is truthy, or `otherwise` content when `value` is falsy.
 */
export function when(value: Readable<any>, then?: Renderable, otherwise?: Renderable): Markup {
  return new Markup((config) => {
    return new Outlet({
      ...config,
      readable: value,
      render: (value) => {
        if (value) {
          return then;
        }

        if (otherwise) {
          return otherwise;
        }

        return null;
      },
    });
  });
}

/**
 * Takes a Readable `value` and displays `then` content when `value` is falsy.
 */
export function unless(value: Readable<any>, then: Renderable): Markup {
  return new Markup((config) => {
    return new Outlet({
      ...config,
      readable: value,
      render: (value) => {
        if (!value) {
          return then;
        }

        return null;
      },
    });
  });
}

export function observe<T>(readable: Readable<T>, render: (value: T) => Renderable): Markup {
  return new Markup((config) => {
    return new Outlet({
      ...config,
      readable: readable,
      render,
    });
  });
}

/**
 * Displays an instance of `view` for each item in `values`. Dynamically adds and removes views as items change.
 * For complex objects with an ID, define a `key` function to select that ID.
 * Object identity (`===`) will be used for comparison if no `key` function is passed.
 *
 * TODO: Describe or link to docs where keying is explained.
 */
export function repeat<T>(
  readable: Readable<Iterable<T>>,
  render: ($value: Readable<T>, $index: Readable<number>, ctx: RepeatContext) => Renderable,
  key?: (value: T, index: number) => string | number
): Markup {
  return new Markup((config) => {
    return new Repeat<T>({
      ...config,
      readable,
      render,
      key,
    });
  });
}
