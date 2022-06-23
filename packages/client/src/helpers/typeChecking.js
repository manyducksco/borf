export const isFunction = (value) => typeof value === "function";

export const isString = (value) => typeof value === "string";

export const isNumber = (value) => typeof value === "number";

export const isArray = (value) => Array.isArray(value);

export const isObject = (value) => value != null && typeof value === "object" && !isArray(value);

export const isDOM = (value) => value != null && (value instanceof Node || value.isDOM === true);

export const isBinding = (value) => value && value.isBinding === true;

export const isComponent = (value) => value && value.isComponent === true;

export const isTemplate = (value) => value && value.isTemplate === true;

export const isService = (value) => value && value.isService === true;
