import { makeState } from "@woofjs/state";
import { isComponent, isComponentInstance, isObject } from "../helpers/typeChecking.js";
import { makeDolla } from "../dolla/makeDolla.js";
import { makeTestWrapper } from "./makeTestWrapper.js";

export function wrapComponent(component, configure) {
  return makeTestWrapper(configure, (getService, ...args) => {
    if (isComponent(component)) {
      let attrs = {};
      let children = [];

      if (isObject(args[0]) && !isComponentInstance(args[0])) {
        attrs = args.shift();
      }

      children = [...args];

      const $route = makeState({
        route: "test",
        path: "/test",
        href: "/test",
        params: {},
        query: {},
        wildcard: null,
      });

      const dolla = makeDolla({ getService, $route });

      return component({
        getService,
        dolla,
        attrs,
        children,
        $route,
      });
    } else {
      throw new Error(`Expected a Component. Received: ${component}`);
    }
  });
}
