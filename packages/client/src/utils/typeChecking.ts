import { Element } from "../elements/Element";

export const isArray = (value: any) => Array.isArray(value);

export const isBoolean = (value: any) => typeof value === "boolean";

export const isFloat = (value: any) => isNumber(value) && !isInteger(value);

export const isFunction = (value: any) => typeof value === "function";

export const isInteger = (value: any) => isNumber(value) && value % 1 === 0;

export const isNumber = (value: any) => typeof value === "number";

export const isObject = (value: any) =>
  value != null && typeof value === "object" && !isArray(value);

export const isString = (value: any) => typeof value === "string";

export const isSubscription = (value: any) => {
  if (isObject(value)) {
    if (
      isBoolean(value.active) &&
      isFunction(value.cancel) &&
      (value.receiver == null || isFunction(value.receiver))
    ) {
      return true;
    }
  }

  return false;
};

export const isBinding = (value: any) =>
  isSubscription(value) && isFunction(value.set);

export const isElement = (value: any) => {
  if (value instanceof Element) {
    return true;
  }

  return false;
};
