import { Listenable, Bindable, Binding } from "../Source";

export const isArray = <T = unknown>(value: unknown): value is T[] =>
  Array.isArray(value);

export const isBoolean = (value: any): value is boolean =>
  typeof value === "boolean";

export const isFloat = (value: any): value is number =>
  isNumber(value) && !isInteger(value);

export const isFunction = (value: any): value is Function =>
  typeof value === "function";

export const isInteger = (value: any): value is number =>
  isNumber(value) && value % 1 === 0;

export const isNumber = (value: any): value is number =>
  typeof value === "number";

export const isObject = <T = any>(value: any): value is T =>
  value != null && typeof value === "object" && !isArray(value);

export const isString = (value: any): value is string =>
  typeof value === "string";

export const isBinding = <T = unknown>(value: any): value is Binding<T> =>
  isFunction(value.set) && isFunction(value.get) && isFunction(value.listen);

export const isListenable = <T = unknown>(
  value: unknown
): value is Listenable<T> => {
  return (
    isObject(value) &&
    isFunction(value.listen) &&
    value.hasOwnProperty("current")
  );
};

export const isBindable = <T = unknown>(
  value: unknown
): value is Bindable<T> => {
  return isObject(value) && isFunction(value.bind);
};
