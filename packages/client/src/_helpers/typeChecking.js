export const isBoolean = (value) => typeof value === "boolean";

export const isFunction = (value) => typeof value === "function";

export const isString = (value) => typeof value === "string";

export const isNumber = (value) => typeof value === "number";

export const isInteger = (value) => isNumber(value) && value % 1 === 0;

export const isFloat = (value) => isNumber(value) && !isInteger(value);

export const isArray = (value) => Array.isArray(value);

export const isObject = (value) => value != null && typeof value === "object" && !isArray(value);

export const isDolla = (value) => value && value.$isDolla == true;

export const isNode = (value) => value && value.$isNode == true;

export const isComponent = (value) => value && value.isComponent == true;
