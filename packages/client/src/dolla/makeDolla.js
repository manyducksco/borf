import { isComponent, isNode, isObject, isString } from "../helpers/typeChecking.js";
import { flatMap } from "../helpers/flatMap.js";

import { makeIf } from "./makeIf.js";
import { makeEach } from "./makeEach.js";
import { makeText } from "./makeText.js";
import { makeWatch } from "./makeWatch.js";
import { makeRoutes } from "./makeRoutes.js";
import { makeElement } from "./makeElement.js";
import { makeFragment } from "./makeFragment.js";
import { makeRenderable } from "./makeRenderable.js";

export function makeDolla({ getService, $route }) {
  /**
   * Creates a renderable node.
   */
  function $(tagOrComponent, ...args) {
    let attrs = {};

    if (args[0] && isObject(args[0]) && !isNode(args[0])) {
      attrs = args.shift();
    }

    const children = flatMap(args)
      .filter((x) => x !== null && x !== undefined && x !== false)
      .map((child) => makeRenderable(child)());

    if (isString(tagOrComponent)) {
      if (tagOrComponent === "") {
        return makeFragment(children);
      } else {
        return makeElement(tagOrComponent, attrs, children);
      }
    } else if (isComponent(tagOrComponent)) {
      return tagOrComponent.create({
        getService,
        debugChannel: getService("@debug").makeChannel("component:~"),
        dolla: $,
        attrs,
        children,
        $route,
      });
    } else {
      throw new TypeError(`Expected a tag name or component. Got: ${tagOrComponent}`);
    }
  }

  /**
   * If $value has a truthy value, show `then`.
   * If $value has a falsy value, show `otherwise`.
   *
   * Both `then` and `otherwise` can be a node or function that returns a node. Both are optional.
   */
  $.if = function ($value, then, otherwise) {
    return makeIf($value, then, otherwise);
  };

  /**
   * Displays one element for each item in `$list`.
   */
  $.each = function ($list, makeKey, makeItem) {
    return makeEach($list, makeKey, makeItem);
  };

  /**
   * Runs `makeItem` on `$value` any time it changes and displays the result.
   */
  $.watch = function ($value, makeItem) {
    return makeWatch($value, makeItem);
  };

  /**
   * Displays a state's value as text. If `$value` is falsy then `defaultValue` is displayed instead.
   */
  $.text = function ($value, defaultValue) {
    return makeText($value, defaultValue);
  };

  /**
   * Registers sub-routes and the components to render when those routes match.
   *
   * @param config - Object with paths as keys and strings or components as values.
   */
  $.routes = function (config) {
    if ($route.get("wildcard") == null) {
      throw new Error(
        `$.routes() can be used only on a route that ends with a wildcard. Current route: ${$route.get("route")}`
      );
    }

    return makeRoutes(getService, $route, config);
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
