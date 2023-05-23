import type { Renderable, Stringable } from "./types";

import htm from "htm/mini";
import { isArray, isFunction, isNumber, isObject, isString } from "@borf/bedrock";
import { makeComponent, type Component } from "./component.js";
import { HTML } from "./classes/HTML.js";
import { Readable } from "./classes/Readable";
import { AppContext, ElementContext } from "./classes/App";
import { Text } from "./classes/Text";
import { Dynamic } from "./classes/Dynamic";
import { Repeat } from "./classes/Repeat";
import { makeVirtual } from "./helpers/virtual";

const MARKUP = Symbol("Markup");

export interface Markup {
  type: string | Component<any>;
  attributes?: Record<string, any>;
  children?: Markup[];
}

export interface DOMHandle {
  readonly node?: Node;
  readonly connected: boolean;
  connect(parent: Node, after?: Node): Promise<void>;
  disconnect(): Promise<void>;
  setChildren(markup: Markup[]): Promise<void>;
}

export interface DOMMarkup extends Markup {
  children?: DOMMarkup[];
  handle: DOMHandle;
}

export interface MarkupAttributes {
  $text: { value: Stringable | Readable<Stringable> };
  $dynamic: { value: Readable<any>; render?: (value: any) => Renderable };
  $repeat: { value: Readable<any[]>; render: any; key?: (value: any, index: number) => string | number };
  [tag: string]: Record<string, any>;
}

export function isMarkup(value: unknown): value is Markup {
  return isObject(value) && value[MARKUP] === true;
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

export function makeMarkup<T extends keyof MarkupAttributes>(type: T, attributes: MarkupAttributes[T]): Markup;

export function makeMarkup<I>(
  type: string | Component<I>,
  attributes?: I | Record<string, any>,
  ...children: Renderable[]
): Markup;

export function makeMarkup<I>(
  type: string | Component<I>,
  attributes?: I | Record<string, any>,
  ...children: Renderable[]
) {
  return {
    [MARKUP]: true,
    type,
    attributes,
    children: toMarkup(children),
  };
}

export const html = htm.bind(makeMarkup);

interface RenderContext {
  app: AppContext;
  element: ElementContext;
}

export function renderMarkupToDOM(markup: Markup | Markup[], ctx: RenderContext): DOMMarkup[] {
  const items = isArray(markup) ? markup : [markup];

  return items.map((item) => {
    let handle!: DOMHandle;

    if (isFunction(item.type)) {
      handle = makeComponent({
        component: item.type as Component<any>,
        attributes: item.attributes,
        children: item.children,
        appContext: ctx.app,
        elementContext: ctx.element,
      });
    } else if (isString(item.type)) {
      switch (item.type) {
        case "$text":
          handle = new Text({
            value: item.attributes!.value,
          });
          break;
        case "$dynamic":
          handle = new Dynamic({
            readable: item.attributes!.value,
            render: item.attributes!.render,
            appContext: ctx.app,
            elementContext: ctx.element,
          });
          break;
        case "$repeat":
          handle = new Repeat({
            readable: item.attributes!.value,
            render: item.attributes!.render,
            key: item.attributes!.key,
            appContext: ctx.app,
            elementContext: ctx.element,
          });
          break;
        case "$virtual":
          handle = makeVirtual({
            readables: item.attributes!.readables,
            render: item.attributes!.render,
            appContext: ctx.app,
            elementContext: ctx.element,
          });
          break;
        default:
          handle = new HTML({
            tag: item.type,
            attributes: item.attributes,
            children: item.children,
            appContext: ctx.app,
            elementContext: ctx.element,
          });
          break;
      }
    } else {
      throw new TypeError(`Expected a string or component function. Got: ${item.type}`);
    }

    return {
      ...item,
      handle,
      children: item.children ? renderMarkupToDOM(item.children, ctx) : undefined,
    };
  });
}

export function patchMarkup(current: DOMMarkup[], next: Markup[]): DOMMarkup[] {
  return [];
}

/**
 * Gets a single handle that controls one or more RenderedMarkups as one.
 */
export function getRenderHandle(rendered: DOMMarkup[]): DOMHandle {
  if (rendered.length === 1) {
    return rendered[0].handle;
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

      for (const item of rendered) {
        const previous = rendered[rendered.length - 1]?.handle.node ?? node;
        await item.handle.connect(parent, previous);
      }

      isConnected = true;
    },
    async disconnect() {
      if (isConnected) {
        for (const item of rendered) {
          item.handle.disconnect();
        }

        node.remove();
      }

      isConnected = false;
    },
    async setChildren() {},
  };
}
