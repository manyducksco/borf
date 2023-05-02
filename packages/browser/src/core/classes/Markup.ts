import { Type } from "@borf/bedrock";
import { type AppContext, type ElementContext } from "./App.js";
import { Text } from "./Text.js";
import { HTML } from "./HTML.js";
import { Readable } from "./Writable.js";
import { Repeat } from "./Repeat.js";
import { Dynamic } from "./Dynamic.js";
import { makeComponent, type Component } from "../component.js";
import { type IntrinsicElements, type Connectable } from "../types.js";
import { Outlet as OutletView } from "../views/Outlet.js";

/* ----- Types ----- */

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
export type Renderable =
  | string
  | number
  | Markup
  | false
  | null
  | undefined
  | Readable<any>
  | (string | number | Markup | false | null | undefined | Readable<any>)[];

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
 * Creates markup nodes that can be rendered to the DOM by a View.
 *
 * @example
 * // Use components:
 * m(ExampleView, { inputOne: "value", inputTwo: 5 })
 *
 * // Create HTML elements:
 * m("span", { style: { color: "red" } }, "This text is red")
 * m("custom-element", "Child content")
 *
 * // Create HTML elements with helpers:
 * m.button({ onclick: () => alert("clicked") }, "Click me!")
 * m.span({ style: { color: "red" } }, "This text is red")
 * m.section([
 *   m.header(m.h1("Hello!")),
 *   m.p("This is a section.")
 * ])
 * // ...
 */
export const m = <MarkupFunction>(<I>(
  element: string | Component<I>,
  attributes?: any,
  ...children: (Renderable | Renderable[])[]
) => {
  if (!children) {
    children = [];
  }

  if (!Type.isArray(children)) {
    children = [children];
  }

  // If attributes isn't null or an object, consider it a child.
  if (Readable.isReadable(attributes) || Markup.isMarkup(attributes) || !Type.isObject(attributes)) {
    children.unshift(attributes as Renderable);
    attributes = {};
  }

  // Filter out falsy children and convert remaining ones to Markup instances.
  const formattedChildren = formatChildren(children.flat(Infinity) as Renderable[]);

  // Components
  if (Type.isFunction<Component<I>>(element)) {
    if (element === OutletView) {
      return OutletView({}); // Special handling for outlets which don't need their own component scope despite being rendered like components.
    }

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
});

/*==============================*\
||            Helpers           ||
\*==============================*/

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

export function isRenderable(value: unknown): value is Renderable {
  return (
    value == null ||
    value === false ||
    typeof value === "string" ||
    typeof value === "number" ||
    Markup.isMarkup(value) ||
    Readable.isReadable(value) ||
    Type.isArrayOf(isRenderable, value)
  );
}

/*==============================*\
||        Template Tools        ||
\*==============================*/

/**
 * Displays `then` content when `value` holds a truthy value. Displays `otherwise` content otherwise.
 */
export function when(value: Readable<any>, then?: Renderable, otherwise?: Renderable): Markup {
  return new Markup((config) => {
    return new Dynamic({
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
 * Displays `then` content when `value` holds a falsy value.
 */
export function unless(value: Readable<any>, then: Renderable): Markup {
  return new Markup((config) => {
    return new Dynamic({
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
    return new Dynamic({
      ...config,
      readable: readable,
      render,
    });
  });
}

/**
 * Renders once for each item in `values`. Dynamically adds and removes views as items change.
 * For complex objects with an ID, define a `key` function to select that ID.
 * Object identity (`===`) will be used for comparison if no `key` function is passed.
 *
 * TODO: Describe or link to docs where keying is explained.
 */
export function repeat<T>(
  readable: Readable<T[]>,
  render: ($value: Readable<T>, $index: Readable<number>) => Markup | Markup[] | null,
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
