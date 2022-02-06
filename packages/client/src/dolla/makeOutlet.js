import { makeRouter } from "@woofjs/router";
import { makeNode } from "./makeNode.js";
import { isFunction, isNode, isComponent, isDolla, isString } from "../helpers/typeChecking.js";
import { makeComponent } from "../makeComponent.js";

/**
 * Work in progress
 */
export const makeOutlet = makeNode((self, getService, debug, node, $route) => {
  const router = makeRouter();
  const debug = getService("@debug").makeChannel("woof:outlet");
  let watchers = [];

  const ctx = {
    route(route, component, attrs = {}) {
      if (isFunction(component)) {
        component = makeComponent(component);
      }

      if (!isComponent(component)) {
        throw new TypeError(`Route needs a path and a component. Got: ${path} and ${component}`);
      }

      if (route === "") {
        route = "/";
      }

      router.on(route, { component, attrs });

      return ctx;
    },
    redirect(route, to) {
      if (isString(to)) {
        if (to === "") {
          to = "/";
        }

        router.on(route, { redirect: to });
      } else {
        throw new TypeError(`Expected a path. Got: ${to}`);
      }

      return ctx;
    },
  };
});
