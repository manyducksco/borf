import { isString, isFunction } from "../helpers/typeChecking.js";

export function makeView(...args) {
  let name;
  let fn;

  if (isString(args[0])) {
    name = args.shift();
  }

  if (isFunction(args[0])) {
    fn = args[0];
  }

  if (!fn) {
    throw new TypeError(`Expected a view function, but no function was passed.`);
  }

  fn.viewName = name;

  return fn;
}
