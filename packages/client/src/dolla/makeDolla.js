import { isComponent, isNode, isObject, isString } from "../helpers/typeChecking.js";
import { flatMap } from "../helpers/flatMap.js";

import { Outlet } from "./Outlet.js";

import { makeIf } from "./makeIf.js";
import { makeEach } from "./makeEach.js";
import { makeText } from "./makeText.js";
import { makeWatch } from "./makeWatch.js";
import { makeElement } from "./makeElement.js";
import { makeFragment } from "./makeFragment.js";
import { makeRenderable } from "./makeRenderable.js";

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

      children = flatMap(children)
        .filter((x) => x != null && x !== false) // ignore null, undefined and false
        .map((child) => makeRenderable(child)());

      switch (elementType) {
        case "component":
          return element.create({
            getService,
            debugChannel: debug.makeChannel("component:~"),
            dolla: $,
            attrs,
            children,
            $route,
          });
        case "element":
          return makeElement(element, attrs, children);
        case "fragment":
          return makeFragment(children);
      }
    }

    Dolla.isDolla = true;

    return Dolla;
  }

  $.if = function ($value, then, otherwise) {
    return makeIf($value, then, otherwise);
  };

  $.each = function ($list, makeKey, makeItem) {
    return makeEach($list, makeKey, makeItem);
  };

  $.watch = function ($value, makeItem) {
    return makeWatch($value, makeItem);
  };

  $.text = function ($value, defaultValue) {
    return makeText($value, defaultValue);
  };

  $.outlet = function (element = "div", attributes = {}) {
    if ($route.get("wildcard") == null) {
      throw new Error(
        `$.outlet() can only be used on routes that end with a wildcard. Current route: ${$route.get("route")}`
      );
    }

    const node = $(element, attributes);

    return new Outlet(getService, debug, node, $route);
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
