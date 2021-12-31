import {
  isComponent,
  isNode,
  isObject,
  isString,
} from "../../_helpers/typeChecking";
import { $Element } from "./$Element";
import { $If } from "./$If";
import { $Map } from "./$Map";
import { $Outlet } from "./$Outlet";
import { $Text } from "./$Text";
import { $Watch } from "./$Watch";
import { makeRender } from "./makeRender";
import htmlTags from "html-tags";
import htmlVoidTags from "html-tags/void";
import { makeState } from "../state/makeState";

/**
 * Creates a $ function with bound injectables.
 */
export function makeDolla({ getService, match }) {
  function $(element, ...args) {
    let defaultAttrs = {};

    if (args[0] && !isNode(args[0]) && isObject(args[0])) {
      defaultAttrs = args.shift();
    }

    let defaultChildren = args;
    let elementType = null;

    if (isComponent(element)) {
      elementType = "component";
    } else if (isString(element)) {
      elementType = "element";
    } else {
      throw new TypeError(
        `Expected a tag name or a Component. Received: ${element}`
      );
    }

    /**
     * @param args - Attributes object (optional) followed by any number of children
     */
    function Dolla(...args) {
      let attributes = { ...defaultAttrs };
      let children = args.length === 0 ? defaultChildren : args;

      if (args[0] && !isNode(args[0]) && isObject(args[0])) {
        attributes = children.shift();
      }

      children = children
        .filter((x) => x != null && x !== false) // ignore null, undefined and false
        .map((child) => makeRender(child)());

      let node;

      if (elementType === "component") {
        node = new element(getService, $, attributes, children);
      } else if (elementType === "element") {
        node = new $Element(element, attributes, children);
      }

      return node;
    }

    Dolla.$isDolla = true;

    return Dolla;
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

  $.outlet = function (element = "div", attributes = {}) {
    if (match.wildcard.get() == false) {
      throw new Error(
        `$.route() can only be used on wildcard routes. Current route: ${match.route.get()}`
      );
    }

    const node = $(element, attributes);

    return new $Outlet(getService, node, match);
  };

  /**
   * Creates a two way binding for input elements. Pass this as an $element's `value` attribute.
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

  $.route = match;

  Object.defineProperty($, "elements", {
    get() {
      const elements = {};

      for (const tag of [...htmlTags, ...htmlVoidTags]) {
        elements[tag] = function (...args) {
          return $(tag, ...args);
        };
      }

      return elements;
    },
  });

  Object.freeze($);

  return $;
}
