import { $Node } from "./$Node";
import { $Element } from "./$Element";
import { $Text } from "./$Text";
import { $If } from "./$If";
import { $Map } from "./$Map";
import { $Route } from "./$Route";
import { isObject, isString } from "../_helpers/typeChecking";

/**
 * Creates a $ function with bound injectables.
 */
export function makeDolla({ app, http, router, getInjectables }) {
  function $(element, defaultAttrs = {}) {
    let type = null;

    if (element.isComponent) {
      type = "component";
    } else if (isString(element)) {
      type = "element";
    } else {
      throw new TypeError(
        `Expected tagname string or Component. Received: ${element}`
      );
    }

    /**
     * @param args - Attributes object (optional) followed by any number of children
     */
    function create(...args) {
      let attributes = { ...defaultAttrs };
      let children = args;
      const firstArg = args[0];

      if (firstArg instanceof $Node == false && isObject(firstArg)) {
        attributes = children.shift();
      }

      children = children
        .filter((x) => x != null && x !== false)
        .map((child) => {
          if (child.isDolla) {
            return child();
          }

          return child;
        });

      let node;

      switch (type) {
        case "component":
          node = new element(attributes, children);
          node.app = app;
          node.http = http;
          node.$ = $;
          return node;
        case "element":
          node = new $Element(element, attributes, children);
          node.app = app;
          node.http = http;
          return node;
      }
    }

    create.isDolla = true;

    return create;
  }

  $.if = function (value, then, otherwise) {
    return new $If(value, then, otherwise);
  };

  $.map = function (items, keyer, create) {
    return new $Map(items, keyer, create);
  };

  $.text = function (value) {
    return new $Text(value);
  };

  $.route = function (element = "div", defaultAttrs) {
    if (router.wildcard == false) {
      throw new Error(
        `$.route() can only be used on wildcard routes. Current route: ${app.route}`
      );
    }

    console.log({ element, defaultAttrs, router });

    const node = $(element, defaultAttrs);

    return new $Route(node, router.params.wildcard, getInjectables);
  };

  return $;
}
