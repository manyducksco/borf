import { isComponent, isNode, isObject } from "../_helpers/typeChecking";
import { makeDolla } from "../main/dolla/Dolla";
import { makeState } from "@woofjs/state";
import { makeTestWrapper } from "./makeTestWrapper";

export function wrapComponent(component) {
  return makeTestWrapper((getService, ...args) => {
    if (isComponent(component)) {
      let attributes = {};
      let children = [];

      if (isObject(args[0]) && !isNode(args[0])) {
        attributes = args.shift();
      }

      children = [...args];

      const $route = makeState({
        route: "test",
        path: "/test",
        params: {},
        query: {},
        wildcard: null,
      });

      const $ = makeDolla({ getService, $route });

      return new component(getService, $, attributes, children, $route);
    } else {
      throw new Error(`Expected a Component. Received: ${component}`);
    }
  });
}
