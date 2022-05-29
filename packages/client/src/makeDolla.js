import { isState } from "@woofjs/state";
import { isComponentInstance, isComponent, isNumber, isObject, isString, isFunction } from "./helpers/typeChecking.js";
import { flatMap } from "./helpers/flatMap.js";
import { makeComponent } from "./makeComponent.js";

import { If } from "./components/If.js";
import { Each } from "./components/Each.js";
import { Text } from "./components/Text.js";
import { Watch } from "./components/Watch.js";
import { Router } from "./components/Router.js";
import { Element } from "./components/Element.js";
import { Fragment } from "./components/Fragment.js";

/**
 * The backbone of Woof's component structure.
 *
 * Passed as the first parameter to all components where it can render elements and other components.
 * Also includes a variety of helper components for working with dynamic states.
 */
export function makeDolla({ getService, $route }) {
  const componentDefaults = {
    getService,
    $route,
    dolla: $,
    children: [],
    attrs: {},
  };

  /**
   * Renders an HTML tag or component as an element.
   */
  function $(tagOrComponent, ...args) {
    let attrs = {};

    if (args[0] && isObject(args[0]) && !isComponentInstance(args[0])) {
      attrs = args.shift();
    }

    const children = flatMap(args)
      // Filter out falsy children (except 0, which is rendered as text)
      .filter((x) => x !== null && x !== undefined && x !== false)
      // Turn children into renderable components
      .map((child) => {
        if (isComponentInstance(child)) {
          return child;
        }

        if (isString(child) || isNumber(child) || isState(child)) {
          return $.text(child);
        }

        throw new TypeError(`Children must be components, strings, numbers or null. Got: ${child}`);
      });

    if (isString(tagOrComponent)) {
      if (tagOrComponent === "") {
        // Treat an empty string as a fragment, similar to JSX's empty element: <></>
        return Fragment({ ...componentDefaults, children });
      } else {
        // Any string besides an empty one is assumed to be a valid HTML tag.
        return Element({
          ...componentDefaults,
          attrs: {
            tag: tagOrComponent,
            attrs: attrs,
          },
          children,
        });
      }
    } else if (isComponent(tagOrComponent)) {
      // When a component is passed instead of a string it takes the attributes and children, ready to render.
      return tagOrComponent({
        ...componentDefaults,
        attrs,
        children,
      });
    } else if (isComponentInstance(tagOrComponent)) {
      // Component instances are passed as-is because they already have their attributes and children.
      return tagOrComponent;
    } else {
      throw new TypeError(`Expected an HTML tag or a component. Got: ${tagOrComponent}`);
    }
  }

  /**
   * If $value has a truthy value, show `then`.
   * If $value has a falsy value, show `otherwise`.
   *
   * Both `then` and `otherwise` can be a function that returns an element, or just an element. Both fields are optional.
   */
  $.if = function ($value, then, otherwise) {
    return If({
      ...componentDefaults,
      attrs: {
        value: $value,
        then,
        otherwise,
      },
    });
  };

  /**
   * Displays one element for each item in `$list`.
   */
  $.each = function ($list, component) {
    // Allow function components
    if (isFunction(component) && !isComponent(component)) {
      component = makeComponent(component);
    }

    return Each({
      ...componentDefaults,
      attrs: {
        value: $list,
        component,
      },
    });
  };

  /**
   * Displays the element returned by `makeItem` every time `$value` changes.
   */
  $.watch = function ($value, makeItem) {
    return Watch({
      ...componentDefaults,
      attrs: {
        value: $value,
        makeItem,
      },
    });
  };

  /**
   * Displays a state's value as text. If `$value` is falsy, then `defaultValue` is displayed instead.
   */
  $.text = function ($value, defaultValue) {
    return Text({
      ...componentDefaults,
      attrs: {
        value: $value,
        defaultValue,
      },
    });
  };

  /**
   * Registers sub-routes and the components to render when those routes match.
   *
   * @example
   * $.router((self) => {
   *   self.route("/example", Component);
   *   self.redirect("*", "./example");
   * });
   *
   * @param defineRoutes - Function to define routes. Takes a router object with methods to define `route`s and `redirect`s similar to the top level app.
   */
  $.router = function (defineRoutes) {
    if ($route.get("wildcard") == null) {
      throw new Error(
        `$.router() can be used only on a route that ends with a wildcard. Current route: ${$route.get("route")}`
      );
    }

    return Router({
      ...componentDefaults,
      attrs: {
        defineRoutes,
      },
    });
  };

  /**
   * Creates a two way binding for input elements. Pass this as an $element's `value` attribute.
   *
   * @param $state
   * @param event
   */
  $.bind = function ($state, event = "input") {
    return {
      isBinding: true,
      event,
      $state,
    };
  };

  Object.freeze($);

  return $;
}
