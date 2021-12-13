import {
  isComponent,
  isNode,
  isObject,
  isString,
} from "../../_helpers/typeChecking";
import { state } from "../state/state";
import { $Element } from "./$Element";
import { $If } from "./$If";
import { $Map } from "./$Map";
import { $Outlet } from "./$Outlet";
import { $Text } from "./$Text";
import { $Watch } from "./$Watch";
import { makeRender } from "./makeRender";
import htmlTags from "html-tags";
import htmlVoidTags from "html-tags/void";

/**
 * Creates a $ function with bound injectables.
 */
export function makeDolla({ getService, route }) {
  function $(element, defaultAttrs = {}, ...defaultChildren) {
    let type = null;

    if (isComponent(element)) {
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

      if (!isNode(firstArg) && isObject(firstArg)) {
        attributes = children.shift();
      }

      children = children
        .filter((x) => x != null && x !== false) // ignore null, undefined and false
        .map((child) => makeRender(child)());

      let node;

      if (type === "component") {
        node = new element(getService, $, attributes, children);
      } else if (type === "element") {
        node = new $Element(element, attributes, children);
      }

      return node;
    }

    create.$isDolla = true;

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

    return new $Outlet(getService, node, route.params.wildcard);
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

  /**
   * Creates a new state that is true if the value of `source` is equal to `value`, and false otherwise.
   *
   * @param source - Source state to receive values from.
   * @param value - Target value to match against.
   */
  $.is = function (source, value) {
    return state.map(source, (current) => current === value);
  };

  Object.defineProperty($, "elements", {
    get() {
      const elements = {};

      for (const tag of [...htmlTags, ...htmlVoidTags]) {
        elements[tag] = function (...args) {
          console.log({ tag, args });
          return $(tag, ...args);
        };
      }

      return elements;
    },
  });

  return $;
}
