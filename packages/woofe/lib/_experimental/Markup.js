import { flatten } from "../helpers/flatten.js";
import { isArray, isFunction, isNumber, isObservable, isString, isConnectable } from "../helpers/typeChecking.js";
import { View } from "./View.js";
import { Text } from "./Text.js";
import { HTML } from "./HTML.js";
import { Outlet } from "./Outlet.js";
import { Connectable } from "./Connectable.js";

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
  // Filter out falsy children and convert remaining ones to Markup instances.
  children = formatChildren(children);

  // Connectable objects like Views and Locals
  if (isConnectable(element)) {
    return new Markup(
      (config) =>
        new element({
          attributes,
          children,
          ...config,
          label: element.label ?? element.name,
          about: element.about,
          attributeDefs: element.attrs,
        })
    );
  }

  // HTML tag like "h1", "span"
  if (isString(element)) {
    return new Markup((config) => new HTML({ attributes, children, ...config, tag: element }));
  }

  // Anonymous view setup function.
  if (isFunction(element)) {
    return new Markup((config) => new View({ ...config, setup: element }));
  }

  console.log({ element, attributes, children });
  throw new TypeError(`Unexpected arguments to m()`);
}

m.when = function when(value, then, otherwise) {
  return new Markup((config) => {
    return new Outlet({
      ...config,
      value,
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

m.unless = function unless(value, then) {
  return new Markup((config) => {
    return new Outlet({
      ...config,
      value,
      render: (value) => {
        if (!value) {
          return then;
        }

        return null;
      },
    });
  });
};

m.repeat = function repeat() {};

m.observe = function observe() {};

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

      console.trace(x);

      throw new TypeError(`Unexpected child type. Got: ${x}`);
    });
}
