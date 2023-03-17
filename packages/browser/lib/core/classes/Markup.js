import { Type } from "@borf/bedrock";
import { flatten } from "../helpers/flatten.js";
import { isConnectable } from "../helpers/typeChecking.js";
import { View } from "./View.js";
import { Text } from "./Text.js";
import { HTML } from "./HTML.js";

export class Markup {
  #setup;

  constructor(setup) {
    this.#setup = setup;
  }

  init(config) {
    return this.#setup(config);
  }
}

export function m(element, attributes, ...children) {
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
    return new Markup((config) => new View({ ...config, setup: element }));
  }

  console.log({ element, attributes, children });
  throw new TypeError(`Unexpected arguments to m()`);
}

/**
 * Filter out falsy children and convert remaining ones to Markup instances.
 */
export function formatChildren(children) {
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
        return new Markup((config) => new Text({ config, value: x }));
      }

      console.trace(x);

      throw new TypeError(`Unexpected child type. Got: ${x}`);
    });
}
