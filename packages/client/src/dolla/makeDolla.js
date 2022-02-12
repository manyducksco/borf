import { isComponent, isComponentConstructor, isNode, isNumber, isObject, isString } from "../helpers/typeChecking.js";
import { flatMap } from "../helpers/flatMap.js";

import { If } from "./components/If.js";
import { Each } from "./components/Each.js";
import { Text } from "./components/Text.js";
import { Watch } from "./components/Watch.js";
import { Routes } from "./components/Routes.js";
import { Element } from "./components/Element.js";
import { Fragment } from "./components/Fragment.js";

export function makeDolla({ getService, $route }) {
  /**
   * Creates a renderable node.
   */
  function $(tagOrComponent, ...args) {
    let attrs = {};

    if (args[0] && isObject(args[0]) && !isComponent(args[0])) {
      attrs = args.shift();
    }

    const children = flatMap(args)
      .filter((x) => x !== null && x !== undefined && x !== false)
      .map((child) => {
        if (isComponent(child)) {
          return child;
        }
        if (isString(child) || isNumber(child)) {
          return $(Text, { value: child });
        }

        throw new TypeError(`Component children must be components, strings, numbers or null. Got: ${child}`);
      });

    if (isString(tagOrComponent)) {
      if (tagOrComponent === "") {
        return Fragment({
          getService,
          $route,
          dolla: $,
          children,
        });
      } else {
        return Element({
          getService,
          $route,
          dolla: $,
          attrs: { tag: tagOrComponent, attrs },
          children,
        });
      }
    } else if (isComponentConstructor(tagOrComponent)) {
      return tagOrComponent({
        getService,
        $route,
        dolla: $,
        attrs,
        children,
      });
    } else if (isComponent(tagOrComponent)) {
      return tagOrComponent;
    } else {
      throw new TypeError(`Expected a tagname or component. Got: ${tagOrComponent}`);
    }
  }

  /**
   * If $value has a truthy value, show `then`.
   * If $value has a falsy value, show `otherwise`.
   *
   * Both `then` and `otherwise` can be a node or function that returns a node. Both are optional.
   */
  $.if = function ($value, then, otherwise) {
    return If({
      getService,
      $route,
      dolla: $,
      attrs: { value: $value, then, otherwise },
    });
  };

  /**
   * Displays one element for each item in `$list`.
   */
  $.each = function ($list, makeKey, makeItem) {
    return Each({
      getService,
      $route,
      dolla: $,
      attrs: { value: $list, makeKey, makeItem },
    });
  };

  /**
   * Runs `makeItem` on `$value` any time it changes and displays the result.
   */
  $.watch = function ($value, makeItem) {
    return Watch({
      getService,
      $route,
      dolla: $,
      attrs: { value: $value, makeItem },
    });
  };

  /**
   * Displays a state's value as text. If `$value` is falsy then `defaultValue` is displayed instead.
   */
  $.text = function ($value, defaultValue) {
    return Text({
      getService,
      $route,
      dolla: $,
      attrs: { value: $value, defaultValue },
    });
  };

  /**
   * Registers sub-routes and the components to render when those routes match.
   *
   * @param config - Object with paths as keys and strings or components as values.
   */
  $.routes = function (config) {
    // if ($route.get("wildcard") == null) {
    //   throw new Error(
    //     `$.routes() can be used only on a route that ends with a wildcard. Current route: ${$route.get("route")}`
    //   );
    // }

    return Routes({
      getService,
      $route,
      dolla: $,
      attrs: { routes: config },
    });
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
