import type { Connectable, Renderable } from "../types";

import { isArray, isString, isNumber } from "@borf/bedrock";
import { type Component } from "../component.js";
import { type AppContext, type ElementContext } from "./App.js";
import { Readable } from "./Readable.js";
import { Text } from "./Text.js";

/* ----- Types ----- */

export interface MarkupConfig {
  appContext: AppContext;
  elementContext: ElementContext;
}

type MarkupMeta<A = null> = {
  type: string | Component<any>;
  attributes: A;
  children: Markup[] | null;
};

/**
 * DOM node factory. This is where things go to be converted into a Connectable.
 */
export class Markup<A = unknown> implements MarkupMeta<A> {
  static isMarkup(value: unknown): value is Markup<any> {
    return value instanceof Markup;
  }

  type;
  attributes;
  children;

  #setup;

  constructor(meta: MarkupMeta<A>, setup: (config: MarkupConfig) => Connectable) {
    this.type = meta.type;
    this.attributes = meta.attributes;
    this.children = meta.children;

    this.#setup = setup;
  }

  /**
   * Creates a new instance of this element.
   */
  create(config: MarkupConfig) {
    return this.#setup(config);
  }
}

/**
 * Filters out falsy children and converts remaining ones to Markup instances.
 */
export function toMarkup(renderables: Renderable | Renderable[]): Markup[] {
  if (!isArray(renderables)) {
    renderables = [renderables];
  }

  return renderables
    .flat(Infinity)
    .filter((x) => x !== null && x !== undefined && x !== false)
    .map((x) => {
      if (Markup.isMarkup(x)) {
        return x;
      }

      if (isString(x) || isNumber(x) || Readable.isReadable(x)) {
        return new Markup(
          { type: "$text", attributes: { value: x }, children: null },
          (config) => new Text({ ...config, value: x })
        );
      }

      throw new TypeError(`Unexpected child type. Got: ${x}`);
    });
}
