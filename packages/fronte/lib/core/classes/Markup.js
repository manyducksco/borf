import { Type } from "@frameworke/bedrocke";
import { flatten } from "../helpers/flatten.js";
import { isConnectable } from "../helpers/typeChecking.js";
import { View } from "./View.js";
import { Text } from "./Text.js";
import { HTML } from "./HTML.js";
import { Outlet } from "./Outlet.js";
import { Repeat } from "./Repeat.js";

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
    return new Markup(
      (config) =>
        new element({
          inputs: attributes,
          children,
          ...config,
          label: element.label ?? element.name,
          about: element.about,
          inputDefs: element.inputs,
        })
    );
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

m.when = function when(value, then, otherwise) {
  then = formatChildren(then);
  otherwise = formatChildren(otherwise);

  return new Markup((config) => {
    return new Outlet({
      ...config,
      value,
      renderFn: (value) => {
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
  then = formatChildren(then);

  return new Markup((config) => {
    return new Outlet({
      ...config,
      value,
      renderFn: (value) => {
        if (!value) {
          return then;
        }

        return null;
      },
    });
  });
};

m.observe = function observe(value, renderFn) {
  return new Markup((config) => {
    return new Outlet({
      ...config,
      value,
      renderFn: renderFn,
    });
  });
};

m.repeat = function repeat(value, renderFn, keyFn) {
  return new Markup((config) => {
    return new Repeat({
      ...config,
      attributes: {
        value,
        renderFn,
        keyFn,
      },
    });
  });
};

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
