import { isComponent, isFunction, isNode, isObject, isString } from "../../_helpers/typeChecking";
import { $Element } from "./$Element";
import { $Fragment } from "./$Fragment";
import { $If } from "./$If";
import { $Each } from "./$Each.js";
import { $Outlet } from "./$Outlet";
import { $Text } from "./$Text";
import { $Watch } from "./$Watch";
import { makeRender } from "./makeRender";

/**
 * Creates a $ function with bound injectables.
 */
export function makeDolla({ getService, debug, $route }) {
  function $(element, ...args) {
    let defaultAttrs = {};

    if (args[0] && !isNode(args[0]) && isObject(args[0])) {
      defaultAttrs = args.shift();
    }

    let defaultChildren = args;
    let elementType = null;

    if (isString(element)) {
      if (element === "" || element === ":fragment:") {
        elementType = "fragment";
      } else {
        elementType = "element";
      }
    } else if (isComponent(element)) {
      elementType = "component";
    } else {
      throw new TypeError(`Expected a tag name or a Component. Received: ${element}`);
    }

    /**
     * @param args - Attributes object (optional) followed by any number of children
     */
    function Dolla(...args) {
      let attrs = { ...defaultAttrs };
      let children = args.length === 0 ? defaultChildren : args;

      if (args[0] && !isNode(args[0]) && isObject(args[0])) {
        attrs = children.shift();
      }

      children = children
        .filter((x) => x != null && x !== false) // ignore null, undefined and false
        .map((child) => makeRender(child)());

      switch (elementType) {
        case "component":
          return element.create({
            getService,
            debug: debug.makeChannel("component:~"),
            dolla: $,
            attrs,
            children,
            $route,
          });
        case "element":
          return new $Element(element, attrs, children);
        case "fragment":
          return new $Fragment(children);
      }
    }

    Object.defineProperty(Dolla, "isDolla", {
      value: true,
      writable: false,
    });

    return Dolla;
  }

  $.if = function (value, then, otherwise) {
    return new $If(value, then, otherwise);
  };

  $.each = function (list, makeKey, makeItem) {
    return new $Each(list, makeKey, makeItem);
  };

  $.watch = function (source, create) {
    return new $Watch(source, create);
  };

  $.text = function (value) {
    return new $Text(value);
  };

  $.outlet = function (element = "div", attributes = {}) {
    if ($route.get("wildcard") == null) {
      throw new Error(
        `$.outlet() can only be used on routes that end with a wildcard. Current route: ${$route.get("route")}`
      );
    }

    const node = $(element, attributes);

    return new $Outlet(getService, debug, node, $route);
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

  Object.freeze($);

  return $;
}
