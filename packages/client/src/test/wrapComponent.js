import { isComponent, isNode, isObject } from "../_helpers/typeChecking";
import { makeDolla } from "../main/dolla/Dolla";
import { makeState } from "../main/state/makeState";
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

      const $ = makeDolla({
        getService,
        match: {
          route: makeState("test", { settable: false }),
          path: makeState("/test", { settable: false }),
          params: makeState({}, { settable: false }),
          query: makeState({}, { settable: false }),
          wildcard: makeState(null, { settable: false }),
        },
      });

      return new component(getService, $, attributes, children);
    } else {
      throw new Error(`Expected a Component. Received: ${component}`);
    }
  });
}
