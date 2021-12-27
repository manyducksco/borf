export const isArray = (value) => Array.isArray(value);

export const isBoolean = (value) => typeof value === "boolean";

export const isFloat = (value) => isNumber(value) && !isInteger(value);

export const isFunction = (value) => typeof value === "function";

export const isInteger = (value) => isNumber(value) && value % 1 === 0;

export const isNumber = (value) => typeof value === "number";

export const isObject = (value) =>
  value != null && typeof value === "object" && !isArray(value);

export const isString = (value) => typeof value === "string";

export const isDolla = (value) => isFunction(value) && value.$isDolla == true;

export const isNode = (value) => isObject(value) && value.$isNode == true;

export const isComponent = (value) =>
  isFunction(value) && value.isComponent == true;

export const isState = (value) => isObject(value) && value.isState;
