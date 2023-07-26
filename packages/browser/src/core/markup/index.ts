import { isArray, isFunction, isNumber, isObject, isString } from "@borf/bedrock";
import { AppContext, ElementContext } from "../App";
import { Readable } from "../state";
import type { Renderable, Stringable } from "../types";
import { makeView, ViewContext, type View } from "../view.js";
import { Conditional } from "./Conditional.js";
import { Observer } from "./Observer";
import { HTML } from "./HTML.js";
import { Outlet } from "./Outlet.js";
import { Text } from "./Text";
import { Repeat } from "./_repeat.js";

/*===========================*\
||           Markup          ||
\*===========================*/

const MARKUP = Symbol("Markup");

/**
 * Markup is a set of element metadata that hasn't been rendered to a DOMHandle yet.
 */
export interface Markup {
  type: string | View<any>;
  attributes?: Record<string, any>;
  children?: Markup[];
}

/**
 * DOMHandle is the generic interface for an element that can be manipulated by the framework.
 */
export interface DOMHandle {
  readonly node?: Node;
  readonly connected: boolean;
  connect(parent: Node, after?: Node): Promise<void>;
  disconnect(): Promise<void>;
  setChildren(children: DOMHandle[]): Promise<void>;
}

export function isMarkup(value: unknown): value is Markup {
  return isObject(value) && value[MARKUP] === true;
}

export function isDOMHandle(value: unknown): value is DOMHandle {
  return isObject(value) && isFunction(value.connect) && isFunction(value.disconnect);
}

export function toMarkup(renderables: Renderable | Renderable[]): Markup[] {
  if (!isArray(renderables)) {
    renderables = [renderables];
  }

  return renderables
    .flat(Infinity)
    .filter((x) => x !== null && x !== undefined && x !== false)
    .map((x) => {
      if (isMarkup(x)) {
        return x;
      }

      if (isString(x) || isNumber(x) || Readable.isReadable(x)) {
        return makeMarkup("$text", { value: x });
      }

      console.error(x);
      throw new TypeError(`Unexpected child type. Got: ${x}`);
    });
}

export interface MarkupAttributes {
  $text: { value: Stringable | Readable<Stringable> };
  $cond: { $predicate: Readable<any>; thenContent?: Renderable; elseContent?: Renderable };
  $repeat: { $items: Readable<any[]>; render: any; key?: (value: any, index: number) => string | number };
  [tag: string]: Record<string, any>;
}

export function makeMarkup<T extends keyof MarkupAttributes>(
  type: T,
  attributes: MarkupAttributes[T],
  ...children: Renderable[]
): Markup;

export function makeMarkup<I>(type: View<I>, attributes?: I, ...children: Renderable[]): Markup;

export function makeMarkup<I>(type: string | View<I>, attributes?: I, ...children: Renderable[]) {
  return {
    [MARKUP]: true,
    type,
    attributes,
    children: toMarkup(children),
  };
}

/*===========================*\
||        Markup Utils       ||
\*===========================*/

/**
 * Displays `thenContent` when `predicate` holds a truthy value, or `elseContent` otherwise.
 */
export function cond(predicate: any | Readable<any>, thenContent?: Renderable, elseContent?: Renderable): Markup {
  const $predicate = Readable.from(predicate);

  return makeMarkup("$cond", {
    $predicate,
    thenContent,
    elseContent,
  });
}

/**
 * Renders once for each item in `values`. Dynamically adds and removes views as items change.
 * For complex objects with an ID, define a `key` function to select that ID.
 * Object identity (`===`) will be used for comparison if no `key` function is passed.
 */
export function repeat<T>(
  value: Readable<T[]> | T[],
  render: ($value: Readable<T>, $index: Readable<number>, ctx: ViewContext) => Markup | Markup[] | null
): Markup;

/**
 * Renders once for each item in `values`. Dynamically adds and removes views as items change.
 * Items are compared for equality based on the values returned from the `key` function.
 */
export function repeat<T>(
  value: Readable<T[]> | T[],
  key: (value: T, index: number) => string | number,
  render: ($value: Readable<T>, $index: Readable<number>, ctx: ViewContext) => Markup | Markup[] | null
): Markup;

export function repeat<T>(value: Readable<T[]> | T[], ...args: any): Markup {
  const $items = Readable.from(value);
  let render;
  let key;

  if (args.length === 1) {
    render = args[0];
  } else if (args.length === 2) {
    key = args[0];
    render = args[1];
  }

  return makeMarkup("$repeat", { $items, render, key });
}

// TODO: Accept multiple observables
export function observe<T>(readable: Readable<T>, render: (value: T) => Renderable) {
  return makeMarkup("$observer", {
    value: readable,
    render,
  });
}

/*===========================*\
||           Render          ||
\*===========================*/

interface RenderContext {
  appContext: AppContext;
  elementContext: ElementContext;
}

export function renderMarkupToDOM(markup: Markup | Markup[], ctx: RenderContext): DOMHandle[] {
  const items = isArray(markup) ? markup : [markup];

  return items.map((item) => {
    if (isFunction(item.type)) {
      return makeView({
        view: item.type as View<any>,
        attributes: item.attributes,
        children: item.children,
        appContext: ctx.appContext,
        elementContext: ctx.elementContext,
      });
    } else if (isString(item.type)) {
      switch (item.type) {
        case "$text":
          return new Text({
            value: item.attributes!.value,
          });
        case "$cond":
          return new Conditional({
            $predicate: item.attributes!.$predicate,
            thenContent: item.attributes!.thenContent,
            elseContent: item.attributes!.elseContent,
            appContext: ctx.appContext,
            elementContext: ctx.elementContext,
          });
        case "$repeat":
          return new Repeat({
            $items: item.attributes!.$items,
            render: item.attributes!.render,
            key: item.attributes!.key,
            appContext: ctx.appContext,
            elementContext: ctx.elementContext,
          });
        case "$observer":
          // TODO: Replace with Observer
          return new Observer({
            readable: item.attributes!.value,
            render: item.attributes!.render,
            appContext: ctx.appContext,
            elementContext: ctx.elementContext,
          });
        case "$outlet":
          return new Outlet(item.attributes!.$children);
        default:
          if (item.type.startsWith("$")) {
            throw new Error(`Unknown markup type: ${item.type}`);
          }
          return new HTML({
            tag: item.type,
            attributes: item.attributes,
            children: item.children,
            appContext: ctx.appContext,
            elementContext: ctx.elementContext,
          });
      }
    } else {
      throw new TypeError(`Expected a string or view function. Got: ${item.type}`);
    }
  });
}

/**
 * Gets a single handle that controls one or more RenderedMarkups as one.
 */
export function getRenderHandle(handles: DOMHandle[]): DOMHandle {
  if (handles.length === 1) {
    return handles[0];
  }

  const node = document.createComment("renderHandle");

  let isConnected = false;

  return {
    get node() {
      return node;
    },
    get connected() {
      return isConnected;
    },
    async connect(parent: Node, after?: Node) {
      parent.insertBefore(node, after ? after : null);

      for (const handle of handles) {
        const previous = handles[handles.length - 1]?.node ?? node;
        await handle.connect(parent, previous);
      }

      isConnected = true;
    },
    async disconnect() {
      if (isConnected) {
        for (const handle of handles) {
          handle.disconnect();
        }

        node.remove();
      }

      isConnected = false;
    },
    async setChildren() {},
  };
}
