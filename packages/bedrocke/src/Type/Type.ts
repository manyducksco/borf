import Symbol_observable from "symbol-observable";
import { Observable } from "../Observable/Observable.js";

type TypeNames =
  // These values can be returned by `typeof`.
  | "string"
  | "number"
  | "bigint"
  | "boolean"
  | "symbol"
  | "undefined"
  | "object"
  | "function"
  // These values are more specific ones that `Type.of` can return.
  | "null"
  | "array"
  | "class"
  | "promise"
  | "observable"
  | "NaN";

// const example = {
//   // Pass a tuple of [check, message] to supply an error message to print when the value fails the test.
//   // validate: [Type.isString, "value must be a string"],
//
//   // Or
//   validate: [Type.isArrayOf(Type.isNumber), "expected an array of numbers"],
//   validate: Type.isString
// };

/**
 * Represents an object that can be called with `new` to produce a T.
 */
type Factory<T> = { new (): T };

/**
 * Unified type checking utilities for JavaScript.
 *
 * The `typeof` and `instanceof` keywords only go so far and have some awkward edge cases.
 * Type is an attempt to create a standardized type checking system that can identify variables
 * in a more specific way. For example, yes, an array *is* an object according to `typeof`, but
 * that's not really what we mean as programmers by an `object`. An object is {}.
 */
export class Type {
  /**
   * Extends `typeof` operator with more specific and useful type distinctions.
   */
  static of(value: unknown): TypeNames {
    if (value === undefined) {
      return "undefined";
    }

    if (value === null) {
      return "null";
    }

    const type = typeof value;

    switch (type) {
      case "number":
        if (isNaN(value as any)) {
          return "NaN";
        }
        return "number";
      case "function":
        if (Type.isClass(value)) {
          return "class";
        }

        return type;
      case "object":
        if (Array.isArray(value)) {
          return "array";
        }

        if (Type.isPromise(value)) {
          return "promise";
        }

        if (Type.isObservable(value)) {
          return "observable";
        }

        return type;
      default:
        return type;
    }
  }

  /**
   * Returns true if `value` is an array.
   */
  static isArray(value: unknown): value is Array<unknown> {
    return Array.isArray(value);
  }

  /**
   * Returns a function that takes a `value` and ensures that it is an array for which `check` returns true for every item.
   *
   * @param check - Function to check items against.
   */
  static isArrayOf<T>(
    check: (item: unknown) => boolean
  ): (value: unknown) => value is T[];

  /**
   * Returns true when `value` is an array and `check` returns true for every item.
   *
   * @param check - Function to check items against.
   * @param value - A possible array.
   */
  static isArrayOf<T>(
    check: (item: unknown) => boolean,
    value: unknown
  ): value is T[];

  static isArrayOf<T>(...args: unknown[]) {
    const check = args[0] as (item: unknown) => boolean;

    const test = (value: unknown): value is T[] => {
      // TODO: Can we infer T from the type of `check`?
      // Example: Type.isArrayOf(Type.isString, someValue) should cast the result as a `string[]`.
      return Array.isArray(value) && value.every((item) => check(item));
    };

    if (args.length < 2) {
      return test;
    } else {
      return test(args[1]);
    }
  }

  /**
   * Returns true if `value` is equal to `true` or `false`.
   */
  static isBoolean(value: unknown): value is boolean {
    return value === true || value === false;
  }

  /**
   * Returns true if `value` is a string.
   */
  static isString(value: unknown): value is string {
    return typeof value === "string";
  }

  // TODO: More specific validation for common types of strings? Email address, URL, UUID, etc?

  /**
   * Returns true if `value` is a function (but not a class).
   */
  static isFunction<T = (...args: unknown[]) => unknown>(
    value: unknown
  ): value is T {
    return typeof value === "function" && !Type.isClass(value);
  }

  /**
   * Returns true if `value` is a number.
   */
  static isNumber(value: unknown): value is number {
    return typeof value === "number" && !isNaN(value);
  }

  /**
   * Returns true if `value` is a number with no fractional component.
   */
  static isInteger(value: unknown): value is number {
    return typeof value === "number" && value % 1 === 0;
  }

  /**
   * Returns true if `value` is a BigInt.
   */
  static isBigInt(value: unknown): value is BigInt {
    return typeof value === "bigint";
  }

  /**
   * Returns true if `value` implements the Promise protocol.
   * This matches true instances of Promise as well as any object that
   * implements `next`, `catch` and `finally` methods.
   *
   * To strictly match instances of Promise, use `Type.isInstanceOf(Promise)`.
   */
  static isPromise<T = unknown>(value: unknown): value is Promise<T> {
    if (value == null) return false;

    const obj = value as any;

    return (
      obj instanceof Promise ||
      (Type.isFunction(obj.then) &&
        Type.isFunction(obj.catch) &&
        Type.isFunction(obj.finally))
    );
  }

  /**
   * Returns true if `value` is a class.
   */
  static isClass(value: unknown): value is { new (): unknown } {
    return typeof value === "function" && /^\s*class\s+/.test(value.toString());
  }

  /**
   * Returns a function that takes a `value` and returns true if `value` extends `constructor`.
   * Value should be a class or constructor function.
   *
   * @param constructor - The constructor a value must extend to match.
   */
  static extends<T>(constructor: T): (value: unknown) => value is Factory<T>;

  /**
   * Returns `true` if `value` extends `constructor`.
   * Value should be a class or constructor function.
   *
   * @param constructor - The constructor `value` must extend.
   * @param value - A value that may extend `constructor`.
   */
  static extends<T extends Function>(
    constructor: T,
    value: unknown
  ): value is Factory<T>;

  static extends<T extends Function>(constructor: T, value?: unknown) {
    const check = (value: unknown) => {
      if (!Type.isFunction(value) && !Type.isClass(value)) {
        return false;
      }

      return value.prototype instanceof constructor;
    };

    if (value === undefined) {
      return check;
    } else {
      return check(value);
    }
  }

  /**
   * Returns a function that takes a `value` and returns true if `value` is an instance of `constructor`.
   *
   * @param constructor - The constructor a value must be an instance of to match.
   */
  static isInstanceOf<T extends Function>(
    constructor: T
  ): (value: unknown) => value is T;

  /**
   * Returns `true` if `value` is an instance of `constructor`.
   *
   * @param constructor - The constructor `value` must be an instance of.
   * @param value - A value that may be an instance of `constructor`.
   */
  static isInstanceOf<T extends Function>(
    constructor: T,
    value: unknown
  ): value is T;

  static isInstanceOf<T extends Function>(...args: unknown[]) {
    const constructor = args[0] as T;

    const test = (value: unknown): value is T => {
      return value instanceof constructor;
    };

    if (args.length < 2) {
      return test;
    } else {
      return test(args[1]);
    }
  }

  /**
   * Returns true if `value` is a Map.
   */
  static isMap<K = unknown, V = unknown>(value: any): value is Map<K, V> {
    return value instanceof Map;
  }

  /**
   * Returns true if `value` is a Set.
   */
  static isSet<T = unknown>(value: any): value is Set<T> {
    return value instanceof Set;
  }

  /**
   * Returns true if `value` implements the Observable protocol.
   */
  static isObservable<T>(value: any): value is Observable<T> {
    if (value == null) {
      return false;
    }

    // Must have a [Symbol.observable] function that returns an Observable.
    if (!Type.isFunction(value[Symbol_observable])) {
      return false;
    }

    const observable = value[Symbol_observable]();

    // Observable must implement the observable protocol.
    if (!Type.isFunction(observable.subscribe)) {
      return false;
    }

    // We have to assume subscribe() returns a valid subscription.
    // We can't call it to make sure because we don't want to cause side effects.
    return true;
  }

  /**
   * Returns true if `value` implements the Iterable protocol.
   */
  static isIterable<T>(value: any): value is Iterable<T> {
    if (value == null) {
      return false;
    }

    // Must have a [Symbol.iterator] function that returns an iterator.
    if (!Type.isFunction(value[Symbol.iterator])) {
      return false;
    }

    const iterator = value[Symbol.iterator]();

    // Iterator must implement the iterator protocol.
    if (!Type.isFunction(iterator.next)) {
      return false;
    }

    // We have to assume next() returns the correct object.
    // We can't call it to make sure because we don't want to cause side effects.
    return true;
  }

  /**
   * Returns true if `value` is a plain JavaScript object.
   */
  static isObject(value: unknown): value is object {
    return value != null && typeof value === "object" && !Array.isArray(value);
  }

  /**
   * Returns true if `value` is equal to `null`.
   */
  static isNull(value: unknown): value is null {
    return value === null;
  }

  /**
   * Returns true if `value` is equal to `undefined`.
   */
  static isUndefined(value: unknown): value is undefined {
    return value === undefined;
  }

  /**
   * Returns true if `value` is equal to `null` or `undefined`.
   */
  static isNullish(value: unknown): value is void {
    return value === null || value === undefined;
  }
}
