import { flatten } from "../helpers/flatten.js";
import { extendsClass } from "../helpers/extendsClass.js";
import { isArray, isFunction, isNumber, isObservable, isString } from "../helpers/typeChecking.js";
import { Connectable } from "./Connectable.js";
import { View } from "./View.js";
import { Text } from "./Text.js";

export class Markup {
  #setup;

  constructor(setup) {
    this.#setup = setup;
  }

  init(config) {
    return this.#setup(config);
  }
}

const isConnectable = extendsClass(Connectable);

export function m(element, attributes, ...children) {
  // Filter out falsy children and convert remaining ones to Markup instances.
  children = formatChildren(children);

  // Connectable objects like Views and Locals
  if (isConnectable(element)) {
    return new Markup(
      (config) => new element({ ...config, name: element.name, about: element.about, attributeDefs: element.attrs })
    );
  }

  // HTML tag like "h1", "span"
  if (isString(element)) {
    return new Markup((config) => new HTMLView({ ...config, attributes, children }));
  }

  // Anonymous view setup function.
  if (isFunction(element)) {
    return new Markup((config) => new View({ ...config, setup: element }));
  }

  console.log({ element, attributes, children });
  throw new TypeError(`Unexpected arguments to m()`);
}

/**
 * Filter out falsy children and convert remaining ones to Markup instances.
 */
export function formatChildren(children) {
  if (!isArray(children)) {
    children = [children];
  }

  return flatten(children)
    .filter((x) => x !== null && x !== undefined && x !== false)
    .map((x) => {
      if (x instanceof Markup) {
        return x;
      }

      if (isFunction(x)) {
        return new Markup((config) => new View({ ...config, setup: x }));
      }

      if (isString(x) || isNumber(x) || isObservable(x)) {
        return new Markup((config) => new Text({ config, value: x }));
      }

      throw new TypeError(`Unexpected child type. Got: ${x}`);
    });
}
