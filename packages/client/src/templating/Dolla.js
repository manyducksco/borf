import { isObject, isString } from "../_helpers/typeChecking";
import { $Element } from "./$Element";
import { $If } from "./$If";
import { $Map } from "./$Map";
import { $Outlet } from "./$Outlet";
import { $Text } from "./$Text";
import { $Watch } from "./$Watch";
import { makeRender } from "./makeRender";

/**
 * Creates a $ function with bound injectables.
 */
export function makeDolla({ app, http, route }) {
  function $(element, defaultAttrs = {}, defaultChildren = []) {
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
      let children = args.length === 0 ? defaultChildren : args;

      const firstArg = args[0];

      if (isObject(firstArg) && !firstArg.isNode) {
        attributes = children.shift();
      }

      children = children
        .filter((x) => x != null && x !== false) // ignore null, undefined and false
        .map((child) => makeRender(child)());

      let node;

      if (type === "component") {
        node = new element($, attributes, children);
      } else if (type === "element") {
        node = new $Element(element, attributes, children);
      }

      node.app = app;
      node.http = http;
      return node;
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

  $.watch = function (source, create) {
    return new $Watch(source, create);
  };

  $.text = function (value) {
    return new $Text(value);
  };

  $.outlet = function (element = "div", defaultAttrs) {
    if (route.wildcard == false) {
      throw new Error(
        `$.route() can only be used on wildcard routes. Current route: ${route.route}`
      );
    }

    const node = $(element, defaultAttrs);

    return new $Outlet(node, route.params.wildcard, () => ({ app, http }));
  };

  /**
   * Creates a two way binding with the value updated on the specified event.
   *
   * @param state
   * @param event
   */
  $.bind = function (state, event = "input") {
    return {
      isBinding: true,
      event,
      state,
    };
  };

  return $;
}
