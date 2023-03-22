export const isFunction = (value) => typeof value === "function";

export const isString = (value) => typeof value === "string";

export const isNumber = (value) => typeof value === "number";

export const isArray = (value) => Array.isArray(value);

export const isObject = (value) => value != null && typeof value === "object" && !isArray(value);

export const isPromise = (value) => value instanceof Promise;

// Everything above this line should be replaced by Type.*

export const isTemplate = (value) => isObject(value) && value.isTemplate === true;

// TODO: Replace this with Store.isStore()
export const isGlobal = (value) => isObject(value) && value.isGlobal === true;
