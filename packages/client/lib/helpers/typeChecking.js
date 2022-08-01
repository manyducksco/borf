import $$observable from "symbol-observable";

export const isFunction = (value) => typeof value === "function";

export const isString = (value) => typeof value === "string";

export const isNumber = (value) => typeof value === "number";

export const isArray = (value) => Array.isArray(value);

export const isObject = (value) => value != null && typeof value === "object" && !isArray(value);

export const isDOM = (value) => (value != null && (value instanceof Node || value.isDOM === true)) || false;

export const isBinding = (value) => (value && value.isBinding === true) || false;

export const isComponent = (value) => (value && value.isComponent === true) || false;

export const isTemplate = (value) => (value && value.isTemplate === true) || false;

export const isService = (value) => (value && value.isService === true) || false;

export const isState = (value) => (value && value.isState === true) || false;

export const isObservable = (value) => (value && value[$$observable] && value === value[$$observable]()) || false;
