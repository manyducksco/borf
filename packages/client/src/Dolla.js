import { Component } from "./Component";
import { $Element } from "./$Element";
import { $Node } from "./$Node";
import { isObject, isString } from "./utils/typeChecking";

/**
 * Creates a $ function with bound injectables.
 */
export function makeDolla({ app, http }) {
  function Dolla(element) {
    let type = null;

    if (element.isComponent) {
      type = "component";
    } else if (isString(element)) {
      type = "element";
    } else {
      throw new TypeError(
        `Expected string or Component but received ${typeof element}`
      );
    }

    /**
     * @param args - Attributes object (optional) followed by any number of children
     */
    function create(...args) {
      let attributes = {};
      let children = args;

      if (!(args[0] instanceof $Node) && isObject(args[0])) {
        attributes = children.shift();
      }

      let node;

      switch (type) {
        case "component":
          node = new element(attributes, children);
          node.app = app;
          node.http = http;
          node.$ = Dolla;
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

  Dolla.if = function (value, then, otherwise) {
    if (value instanceof Function) {
    } else {
      if (value) {
        return then();
      } else if (otherwise) {
        return otherwise();
      }
    }
  };

  Dolla.map = function () {};

  Dolla.text = function () {};

  Dolla.router = function () {
    return {
      route() {},
    };
  };

  return Dolla;
}
