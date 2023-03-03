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

/**
 * Represents an object that can be called with `new` to produce a T.
 */
type Factory<T> = { new (): T };

/**
 * Unified type checking utilities for JavaScript.
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
   * Throws an error if `value` is not an array.
   */
  static assertArray(
    value: unknown,
    errorMessage?: string
  ): value is Array<unknown> {
    if (Array.isArray(value)) {
      return true;
    }

    throw new TypeError(
      formatError(
        value,
        errorMessage || "Expected array. Got type: %t, value: %v"
      )
    );
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
      return Array.isArray(value) && value.every((item) => check(item));
    };

    if (args.length < 2) {
      return test;
    } else {
      return test(args[1]);
    }
  }

  /**
   * Returns a function that takes a `value` and throws a TypeError unless it is an array for which `check` returns true for every item.
   *
   * @param check - Function to check items against.
   */
  static assertArrayOf<T>(
    check: (item: unknown) => boolean
  ): (value: unknown) => value is T[];

  /**
   * Throws a TypeError unless `value` is an array and `check` returns true for every item.
   *
   * @param check - Function to check items against.
   * @param value - A possible array.
   * @param errorMessage - A custom error message.
   */
  static assertArrayOf<T>(
    check: (item: unknown) => boolean,
    value: unknown,
    errorMessage?: string
  ): value is T[];

  static assertArrayOf<T>(...args: unknown[]) {
    const check = args[0] as (item: unknown) => boolean;
    const message = Type.isString(args[2])
      ? args[2]
      : "Expected an array of valid items. Got type: %t, value: %v";

    const test = (value: unknown): value is T[] => {
      if (Array.isArray(value) && value.every((item) => check(item))) {
        return true;
      }

      throw new TypeError(formatError(value, message));
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
   * Throws a TypeError unless `value` is equal to `true` or `false`.
   */
  static assertBoolean(
    value: unknown,
    errorMessage?: string
  ): value is boolean {
    if (Type.isBoolean(value)) {
      return true;
    }

    throw new TypeError(
      formatError(
        value,
        errorMessage ?? "Expected a boolean. Got type: %t, value: %v"
      )
    );
  }

  /**
   * Returns true if `value` is a string.
   */
  static isString(value: unknown): value is string {
    return typeof value === "string";
  }

  /**
   * Throws a TypeError unless `value` is a string.
   */
  static assertString(value: unknown, errorMessage?: string): value is string {
    if (Type.isString(value)) {
      return true;
    }

    throw new TypeError(
      formatError(
        value,
        errorMessage ?? "Expected a string. Got type: %t, value: %v"
      )
    );
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
   * Throws a TypeError unless `value` is a function.
   */
  static assertFunction<T = (...args: unknown[]) => unknown>(
    value: unknown,
    errorMessage?: string
  ): value is T {
    if (Type.isFunction(value)) {
      return true;
    }

    throw new TypeError(
      formatError(
        value,
        errorMessage ?? "Expected a function. Got type: %t, value: %v"
      )
    );
  }

  /**
   * Returns true if `value` is a number.
   */
  static isNumber(value: unknown): value is number {
    return typeof value === "number" && !isNaN(value);
  }

  /**
   * Throws a TypeError unless `value` is a number.
   */
  static assertNumber(value: unknown, errorMessage?: string): value is number {
    if (Type.isNumber(value)) {
      return true;
    }

    throw new TypeError(
      formatError(
        value,
        errorMessage ?? "Expected a number. Got type: %t, value: %v"
      )
    );
  }

  /**
   * Returns true if `value` is a number with no fractional component.
   */
  static isInteger(value: unknown): value is number {
    return typeof value === "number" && value % 1 === 0;
  }

  /**
   * Throws a TypeError unless `value` is a number with no fractional component.
   */
  static assertInteger(value: unknown, errorMessage?: string): value is number {
    if (Type.isInteger(value)) {
      return true;
    }

    throw new TypeError(
      formatError(
        value,
        errorMessage ?? "Expected an integer. Got type: %t, value: %v"
      )
    );
  }

  /**
   * Returns true if `value` is a BigInt.
   */
  static isBigInt(value: unknown): value is BigInt {
    return typeof value === "bigint";
  }

  /**
   * Throws a TypeError unless `value` is a BigInt.
   */
  static assertBigInt(value: unknown, errorMessage?: string): value is BigInt {
    if (Type.isBigInt(value)) {
      return true;
    }

    throw new TypeError(
      formatError(
        value,
        errorMessage ?? "Expected a BigInt. Got type: %t, value: %v"
      )
    );
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
   * Throws a TypeError unless `value` implements the Promise protocol.
   * This matches true instances of Promise as well as any object that
   * implements `next`, `catch` and `finally` methods.
   *
   * To strictly allow only instances of Promise, use `Type.assertInstanceOf(Promise)`.
   */
  static assertPromise<T = unknown>(
    value: unknown,
    errorMessage?: string
  ): value is Promise<T> {
    if (Type.isPromise(value)) {
      return true;
    }

    throw new TypeError(
      formatError(
        value,
        errorMessage ?? "Expected a promise. Got type: %t, value: %v"
      )
    );
  }

  /**
   * Returns true if `value` is a class.
   */
  static isClass(value: unknown): value is { new (): unknown } {
    return typeof value === "function" && /^\s*class\s+/.test(value.toString());
  }

  /**
   * Throws a TypeError unless `value` is a class.
   */
  static assertClass(
    value: unknown,
    errorMessage?: string
  ): value is { new (): unknown } {
    if (Type.isClass(value)) {
      return true;
    }

    throw new TypeError(
      formatError(
        value,
        errorMessage ?? "Expected a class. Got type: %t, value: %v"
      )
    );
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
   * Returns a function that takes a `value` and throws a TypeError unless `value` extends `constructor`.
   * Value should be a class or constructor function.
   *
   * @param constructor - The constructor a value must extend to match.
   */
  static assertExtends<T>(
    constructor: T
  ): (value: unknown) => value is Factory<T>;

  /**
   * Throws a TypeError unless `value` extends `constructor`.
   * Value should be a class or constructor function.
   *
   * @param constructor - The constructor `value` must extend.
   * @param value - A value that may extend `constructor`.
   */
  static assertExtends<T extends Function>(
    constructor: T,
    value: unknown,
    errorMessage?: string
  ): value is Factory<T>;

  static assertExtends<T extends Function>(
    constructor: T,
    value?: unknown,
    errorMessage?: string
  ) {
    const check = (value: unknown) => {
      if (Type.isFunction(value) || Type.isClass(value)) {
        if (value.prototype instanceof constructor) {
          return true;
        }
      }

      throw new TypeError(
        formatError(
          value,
          errorMessage ??
            `Expected a class or function that extends ${constructor.name}. Got type: %t, value: %v`
        )
      );
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
   * Returns a function that takes a `value` and throws a TypeError unless `value` is an instance of `constructor`.
   *
   * @param constructor - The constructor a value must be an instance of to match.
   */
  static assertInstanceOf<T extends Function>(
    constructor: T
  ): (value: unknown) => value is T;

  /**
   * Throws a TypeError unless `value` is an instance of `constructor`.
   *
   * @param constructor - The constructor `value` must be an instance of.
   * @param value - A value that may be an instance of `constructor`.
   * @param errorMessage - A custom error message for when the assertion fails.
   */
  static assertInstanceOf<T extends Function>(
    constructor: T,
    value: unknown,
    errorMessage?: string
  ): value is T;

  static assertInstanceOf<T extends Function>(...args: unknown[]) {
    const constructor = args[0] as T;
    const errorMessage = Type.isString(args[2])
      ? args[2]
      : `Expected instance of ${constructor.name}. Got type: %t, value: %v`;

    const test = (value: unknown): value is T => {
      if (value instanceof constructor) {
        return true;
      }

      throw new TypeError(formatError(value, errorMessage));
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
   * Throws a TypeError unless `value` is a Map.
   */
  static assertMap<K = unknown, V = unknown>(
    value: any,
    errorMessage?: string
  ): value is Map<K, V> {
    if (Type.isMap(value)) {
      return true;
    }

    throw new TypeError(
      formatError(
        value,
        errorMessage ?? "Expected a Map. Got type: %t, value: %v"
      )
    );
  }

  /**
   * Returns true if `value` is a Set.
   */
  static isSet<T = unknown>(value: any): value is Set<T> {
    return value instanceof Set;
  }

  /**
   * Throws a TypeError if `value` is not a Set.
   */
  static assertSet<T = unknown>(
    value: any,
    errorMessage?: string
  ): value is Set<T> {
    if (Type.isSet(value)) {
      return true;
    }

    throw new TypeError(
      formatError(
        value,
        errorMessage ?? "Expected a Set. Got type: %t, value: %v"
      )
    );
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
   * Throws a TypeError unless `value` implements the Observable protocol.
   */
  static assertObservable<T>(
    value: any,
    errorMessage?: string
  ): value is Observable<T> {
    if (Type.isObservable(value)) {
      return true;
    }

    throw new TypeError(
      formatError(
        value,
        errorMessage ??
          "Expected an object that implements the observable protocol. Got type: %t, value: %v"
      )
    );
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
   * Throws a TypeError unless `value` implements the Iterable protocol.
   */
  static assertIterable<T>(
    value: any,
    errorMessage?: string
  ): value is Iterable<T> {
    if (Type.isIterable(value)) {
      return true;
    }

    throw new TypeError(
      formatError(
        value,
        errorMessage ??
          "Expected an object that implements the iterable protocol. Got type: %t, value: %v"
      )
    );
  }

  /**
   * Returns true if `value` is a plain JavaScript object.
   */
  static isObject(value: unknown): value is object {
    return value != null && typeof value === "object" && !Array.isArray(value);
  }

  /**
   * Throws a TypeError unless `value` is a plain JavaScript object.
   */
  static assertObject(value: unknown, errorMessage?: string): value is object {
    if (Type.isObject(value)) {
      return true;
    }

    throw new TypeError(
      formatError(
        value,
        errorMessage ?? "Expected an object. Got type: %t, value: %v"
      )
    );
  }

  /**
   * Returns true if `value` is equal to `null`.
   */
  static isNull(value: unknown): value is null {
    return value === null;
  }

  /**
   * Throws a TypeError unless `value` is equal to `null`.
   */
  static assertNull(value: unknown, errorMessage?: string): value is null {
    if (value === null) {
      return true;
    }

    throw new TypeError(
      formatError(
        value,
        errorMessage ?? "Expected null. Got type: %t, value: %v"
      )
    );
  }

  /**
   * Returns true if `value` is equal to `undefined`.
   */
  static isUndefined(value: unknown): value is undefined {
    return value === undefined;
  }

  /**
   * Throws a TypeError unless `value` is equal to `undefined`.
   */
  static assertUndefined(
    value: unknown,
    errorMessage?: string
  ): value is undefined {
    if (value === undefined) {
      return true;
    }

    throw new TypeError(
      formatError(
        value,
        errorMessage ?? "Expected undefined. Got type: %t, value: %v"
      )
    );
  }

  /**
   * Returns true if `value` is equal to `null` or `undefined`.
   */
  static isEmpty(value: unknown): value is void {
    return value === null || value === undefined;
  }

  /**
   * Throws a TypeError unless `value` is equal to `null` or `undefined`.
   */
  static assertEmpty(value: unknown, errorMessage?: string): value is void {
    if (value == null) {
      return true;
    }

    throw new TypeError(
      formatError(
        value,
        errorMessage ?? "Expected null or undefined. Got type: %t, value: %v"
      )
    );
  }
}

/**
 * Replaces `%t` and `%v` placeholders in a message with real values.
 */
function formatError(value: unknown, message: string) {
  const typeName = Type.of(value);

  // TODO: Pretty format value as string based on type.
  const valueString = value?.toString?.() || String(value);

  return message.replaceAll("%t", typeName).replaceAll("%v", valueString);
}
