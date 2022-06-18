import { initComponent } from "../helpers/initComponent.js";
import { isObject, isTemplate } from "../helpers/typeChecking.js";
import { makeTestWrapper } from "./makeTestWrapper.js";

export function wrapComponent(component, configure) {
  return makeTestWrapper(configure, (getService, ...args) => {
    if (isFunction(component)) {
      let attrs = {};
      let children = [];

      if (isObject(args[0]) && !isTemplate(args[0])) {
        attrs = args.shift();
      }

      children = [...args];

      return initComponent(getService("@app"), component, attrs, children);
    } else {
      throw new Error(`Expected a component function. Got: ${typeof component}`);
    }
  });
}
