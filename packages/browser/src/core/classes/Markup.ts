import { Type } from "@borf/bedrock";
import { Connectable } from "./Connectable.js";
import { type AppContext, type ElementContext } from "./App.js";
import { Text } from "./Text.js";
import { HTML } from "./HTML.js";
import { Readable } from "./Writable.js";
import { Repeat, type RepeatContext } from "./Repeat.js";
import { Outlet } from "./Outlet.js";
import { makeComponent, type Component } from "../component.js";
import { type IntrinsicElements } from "../types.js";

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
export type Renderable = string | number | Markup | false | null | undefined | Readable<any>;

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

interface MarkupElement<Attrs> {
  (attributes: Attrs, ...children: (Renderable | Renderable[])[]): Markup;
  (...children: (Renderable | Renderable[])[]): Markup;
}

type Elements = { [K in keyof IntrinsicElements]: MarkupElement<IntrinsicElements[K]> };

interface MarkupFunction extends Elements {
  <T extends keyof IntrinsicElements>(
    tag: T,
    attributes: IntrinsicElements[T],
    ...children: (Renderable | Renderable[])[]
  ): Markup;

  <T extends keyof IntrinsicElements>(tag: T, ...children: (Renderable | Renderable[])[]): Markup;

  // export function m(tag: string, attributes: any, ...children: (Renderable | Renderable[])[]): Markup;

  // export function m(tag: string, ...children: (Renderable | Renderable[])[]): Markup;

  <I>(component: Component<I>, inputs?: I, ...children: (Renderable | Renderable[])[]): Markup;

  /**
   * Displays `then` content when `value` holds a truthy value. Displays `otherwise` content otherwise.
   */
  $if(value: Readable<any>, then?: Renderable, otherwise?: Renderable): Markup;

  /**
   * Displays `then` content when `value` holds a falsy value.
   */
  $unless(value: Readable<any>, then: Renderable): Markup;

  $observe<T>(readable: Readable<T>, render: (value: T) => Renderable): Markup;

  /**
   * Renders once for each item in `values`. Dynamically adds and removes views as items change.
   * For complex objects with an ID, define a `key` function to select that ID.
   * Object identity (`===`) will be used for comparison if no `key` function is passed.
   *
   * TODO: Describe or link to docs where keying is explained.
   */
  $repeat<T>(
    readable: Readable<Iterable<T>>,
    render: ($value: Readable<T>, $index: Readable<number>, ctx: RepeatContext) => Markup | null,
    key?: (value: T, index: number) => string | number
  ): Markup;
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
||         HTML Elements        ||
\*==============================*/

const tags: (keyof IntrinsicElements)[] = [
  "a",
  "abbr",
  "address",
  "area",
  "article",
  "aside",
  "audio",
  "b",
  "bdi",
  "bdo",
  "blockquote",
  "br",
  "button",
  "canvas",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "data",
  "dd",
  "del",
  "details",
  "dfn",
  "dialog",
  "div",
  "dl",
  "dt",
  "em",
  "embed",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hgroup",
  "hr",
  "i",
  "iframe",
  "img",
  "input",
  "ins",
  "kbd",
  "label",
  "legend",
  "li",
  "main",
  "map",
  "mark",
  "menu",
  "meter",
  "nav",
  "object",
  "ol",
  "optgroup",
  "option",
  "output",
  "p",
  "pre",
  "progress",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "section",
  "select",
  "small",
  "source",
  "span",
  "strong",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "tr",
  "track",
  "ul",
  "var", // this is a JS keyword, but that shouldn't pose a problem if called as `m.var()`
  "video",
  "wbr",
];

for (const tag of tags) {
  m[tag] = (...args) => m(tag, ...(args as any));
}

/*==============================*\
||       Special Elements       ||
\*==============================*/

m.$if = function $if(value: Readable<any>, then?: Renderable, otherwise?: Renderable): Markup {
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
};

/**
 * Takes a Readable `value` and displays `then` content when `value` is falsy.
 */
m.$unless = function $unless(value: Readable<any>, then: Renderable): Markup {
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
};

m.$observe = function $observe<T>(readable: Readable<T>, render: (value: T) => Renderable): Markup {
  return new Markup((config) => {
    return new Outlet({
      ...config,
      readable: readable,
      render,
    });
  });
};

/**
 * Displays an instance of `view` for each item in `values`. Dynamically adds and removes views as items change.
 * For complex objects with an ID, define a `key` function to select that ID.
 * Object identity (`===`) will be used for comparison if no `key` function is passed.
 *
 * TODO: Describe or link to docs where keying is explained.
 */
m.$repeat = function $repeat<T>(
  readable: Readable<Iterable<T>>,
  render: ($value: Readable<T>, $index: Readable<number>, ctx: RepeatContext) => Markup | null,
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
};
