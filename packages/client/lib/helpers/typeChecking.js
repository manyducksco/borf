import $$observable from "symbol-observable";

export const isFunction = (value) => typeof value === "function";

export const isString = (value) => typeof value === "string";

export const isNumber = (value) => typeof value === "number";

export const isArray = (value) => Array.isArray(value);

/**
 * Validates that `value` is an array and all items pass `checkFn`.
 */
export const isArrayOf = (checkFn, value) => isArray(value) && !value.some((x) => !checkFn(x));

export const isObject = (value) => value != null && typeof value === "object" && !isArray(value);

export const isDOM = (value) => value != null && (value instanceof Node || value.isDOM === true);

export const isBinding = (value) => isObject(value) && value.isBinding === true;

export const isView = (value) => isObject(value) && value.isView === true;

export const isTemplate = (value) => isObject(value) && value.isTemplate === true;

export const isState = (value) => isObject(value) && value.isState === true;

export const isObservable = (value) => (value && value[$$observable] && value === value[$$observable]()) || false;

export const isObserver = (value) =>
  isObject(value) &&
  (value.next == null || isFunction(value.next)) &&
  (value.error == null || isFunction(value.error)) &&
  (value.complete == null || isFunction(value.complete));
