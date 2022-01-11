import { makeState } from "@woofjs/state";
import { isComponent, isNode, isObject } from "../helpers/typeChecking.js";
import { makeDolla } from "../dolla/makeDolla.js";
import { makeTestWrapper } from "./makeTestWrapper.js";

export function wrapComponent(component) {
  return makeTestWrapper((getService, ...args) => {
    if (isComponent(component)) {
      const debug = getService("@debug").makeChannel("component:wrapped");

      let attrs = {};
      let children = [];

      if (isObject(args[0]) && !isNode(args[0])) {
        attrs = args.shift();
      }

      children = [...args];

      const $route = makeState({
        route: "test",
        path: "/test",
        params: {},
        query: {},
        wildcard: null,
      });

      const dolla = makeDolla({ getService, debug, $route });

      return component.create({
        getService,
        debug,
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
