import test from "ava";
import { Type } from "./Type.js";
import { Hash } from "../Hash/Hash.js";

test("isArray, assertArray", (t) => {
  t.assert(Type.isArray([]));
  t.assert(!Type.isArray({}));
  t.assert(!Type.isArray({ 0: "zero", 1: "one", length: 2 }));
  t.assert(!Type.isArray(5));

  t.notThrows(() => Type.assertArray([]));
  t.throws(() => Type.assertArray({}));
  t.throws(() => Type.assertArray({ 0: "zero", 1: "one", length: 2 }));
  t.throws(() => Type.assertArray(5));
});

test("isArrayOf, assertArrayOf", (t) => {
  const numbers = [1, 2, 3];
  const strings = ["dog", "cat", "duck"];

  t.assert(Type.isArrayOf(Type.isNumber, numbers));
  t.assert(Type.isArrayOf(Type.isString, strings));
  t.assert(!Type.isArrayOf(Type.isNumber, strings));

  t.notThrows(() => Type.assertArrayOf(Type.isNumber, numbers));
  t.notThrows(() => Type.assertArrayOf(Type.isString, strings));
  t.throws(() => Type.assertArrayOf(Type.isNumber, strings));

  const isNumberArray = Type.isArrayOf(Type.isNumber);

  t.assert(Type.isFunction(isNumberArray));
  t.assert(isNumberArray(numbers));
  t.assert(!isNumberArray(strings));

  const assertNumberArray = Type.assertArrayOf(Type.isNumber);

  t.assert(Type.assertFunction(assertNumberArray));
  t.notThrows(() => assertNumberArray(numbers));
  t.throws(() => assertNumberArray(strings));
});

test("isBoolean, assertBoolean", (t) => {
  t.assert(Type.isBoolean(true));
  t.assert(Type.isBoolean(false));
  t.assert(!Type.isBoolean("true"));
  t.assert(!Type.isBoolean(0));

  t.notThrows(() => Type.assertBoolean(true));
  t.notThrows(() => Type.assertBoolean(false));
  t.throws(() => Type.assertBoolean("true"));
  t.throws(() => Type.assertBoolean(0));
});

test("isString, assertString", (t) => {
  t.assert(Type.isString(""));
  t.assert(Type.isString("Hello"));
  t.assert(!Type.isString(5));
  t.assert(!Type.isString(["c", "h", "a", "r", "s"]));

  t.notThrows(() => Type.assertString(""));
  t.notThrows(() => Type.assertString("Hello"));
  t.throws(() => Type.assertString(5));
  t.throws(() => Type.assertString(["c", "h", "a", "r", "s"]));
});

test("isFunction, assertFunction", (t) => {
  t.assert(Type.isFunction(() => {}));
  t.assert(Type.isFunction(async () => {}));
  t.assert(Type.isFunction(function () {}));
  t.assert(!Type.isFunction("function () {}"));
  t.assert(
    !Type.isFunction({
      call() {
        throw new Error("nope");
      },
    })
  );
  t.assert(
    !Type.isFunction(
      class {
        message: string;

        constructor() {
          this.message = "This is a class.";
        }

        print() {
          console.log(this.message);
        }
      }
    )
  );

  t.notThrows(() => Type.assertFunction(() => {}));
  t.notThrows(() => Type.assertFunction(async () => {}));
  t.notThrows(() => Type.assertFunction(function () {}));
  t.throws(() => Type.assertFunction("function () {}"));
  t.throws(() =>
    Type.assertFunction({
      call() {
        throw new Error("nope");
      },
    })
  );
  t.throws(() =>
    Type.assertFunction(
      class {
        message: string;

        constructor() {
          this.message = "This is a class.";
        }

        print() {
          console.log(this.message);
        }
      }
    )
  );
});

test("isNumber, assertNumber", (t) => {
  t.assert(Type.isNumber(1));
  t.assert(!Type.isNumber("5"));
  t.assert(!Type.isNumber(BigInt(5)));

  t.notThrows(() => Type.assertNumber(1));
  t.throws(() => Type.assertNumber("5"));
  t.throws(() => Type.assertNumber(BigInt(5)));
});

test("isInteger, assertInteger", (t) => {
  t.assert(Type.isInteger(23));
  t.assert(!Type.isInteger(1.5));

  t.notThrows(() => Type.assertInteger(23));
  t.throws(() => Type.assertInteger(1.5));
});

test("isBigInt, assertBigInt", (t) => {
  t.assert(Type.isBigInt(BigInt(5)));
  t.assert(!Type.isBigInt(5));

  t.notThrows(() => Type.assertBigInt(BigInt(5)));
  t.throws(() => Type.assertBigInt(5));
});

test("isClass, assertClass", (t) => {
  class Example {}
  const instance = new Example();

  t.assert(Type.isClass(Example));
  t.assert(!Type.isClass(instance));

  t.notThrows(() => Type.assertClass(Example));
  t.throws(() => Type.assertClass(instance));
});

test("extends, assertExtends", (t) => {
  class SuperClass {}
  class OtherClass {}
  class SubClass extends SuperClass {}
  const instance = new SubClass();

  t.assert(Type.extends(SuperClass, SubClass));
  t.assert(!Type.extends(SuperClass, OtherClass));
  t.assert(!Type.extends(SuperClass, instance));

  t.notThrows(() => Type.assertExtends(SuperClass, SubClass));
  t.throws(() => Type.assertExtends(SuperClass, OtherClass));
  t.throws(() => Type.assertExtends(SuperClass, instance));

  const extendsSuperClass = Type.extends(SuperClass);

  t.assert(extendsSuperClass(SubClass));
  t.assert(!extendsSuperClass(OtherClass));
  t.assert(!extendsSuperClass(instance)); // Instances are not a class.

  const assertExtendsSuperClass = Type.assertExtends(SuperClass);

  t.notThrows(() => assertExtendsSuperClass(SubClass));
  t.throws(() => assertExtendsSuperClass(OtherClass));
  t.throws(() => assertExtendsSuperClass(instance));
});

test("isPromise, assertPromise", (t) => {
  const promise = Promise.resolve();
  const promiseLike = {
    then() {},
    catch() {},
    finally() {},
  };

  t.assert(Type.isPromise(promise));
  t.assert(Type.isPromise(promiseLike));
  t.assert(!Type.isPromise("donuts"));

  t.notThrows(() => Type.assertPromise(promise));
  t.notThrows(() => Type.assertPromise(promiseLike));
  t.throws(() => Type.assertPromise("donuts"));
});

test("isInstanceOf, assertInstanceOf", (t) => {
  class Example {}
  class SubExample extends Example {}

  const example = new Example();
  const subExample = new SubExample();

  t.assert(Type.isInstanceOf(Example, example));
  t.assert(Type.isInstanceOf(SubExample, subExample));
  t.assert(Type.isInstanceOf(Example, subExample));

  t.notThrows(() => Type.assertInstanceOf(Example, example));
  t.notThrows(() => Type.assertInstanceOf(SubExample, subExample));
  t.notThrows(() => Type.assertInstanceOf(Example, subExample));

  const isExample = Type.isInstanceOf(Example);

  t.assert(Type.isFunction(isExample));
  t.assert(isExample(example));
  t.assert(isExample(subExample));

  const assertExample = Type.assertInstanceOf(Example);

  t.assert(Type.isFunction(assertExample));
  t.notThrows(() => assertExample(example));
  t.notThrows(() => assertExample(subExample));
});

test("isMap, assertMap", (t) => {
  t.assert(Type.isMap(new Map()));
  t.assert(Type.isMap(new Hash()));
  t.assert(!Type.isMap({}));
  t.assert(!Type.isMap(5));

  t.notThrows(() => Type.assertMap(new Map()));
  t.notThrows(() => Type.assertMap(new Hash()));
  t.throws(() => Type.assertMap({}));
  t.throws(() => Type.assertMap(5));
});

test("isSet, assertSet", (t) => {
  t.assert(Type.isSet(new Set()));
  t.assert(!Type.isSet(new Map()));
  t.assert(!Type.isSet(undefined));

  t.notThrows(() => Type.assertSet(new Set()));
  t.throws(() => Type.assertSet(new Map()));
  t.throws(() => Type.assertSet(undefined));
});

test("isIterable, assertIterable", (t) => {
  // Arrays are iterable.
  t.assert(Type.isIterable([1, 2, 3]));

  // Maps are iterable.
  t.assert(
    Type.isIterable(
      new Map([
        ["one", 1],
        ["two", 2],
      ])
    )
  );

  // Arbitrary objects that implement the Iterable protocol are iterable.
  const iterable = {
    _value: 0,

    [Symbol.iterator]() {
      return this;
    },

    next() {
      return {
        value: ++this._value,
      };
    },
  };

  t.assert(Type.isIterable(iterable));

  // Non-iterable values are non-iterable.
  t.assert(!Type.isIterable(1));
  t.assert(!Type.isIterable(() => {}));
  t.assert(!Type.isIterable({}));

  t.notThrows(() => Type.assertIterable(iterable));
  t.throws(() => Type.assertIterable(1));
  t.throws(() => Type.assertIterable(() => {}));
  t.throws(() => Type.assertIterable({}));
});

test("isObject, assertObject", (t) => {
  t.assert(Type.isObject({}));
  t.assert(!Type.isObject(null));
  t.assert(!Type.isObject([]));
  t.assert(!Type.isObject(() => {}));

  t.notThrows(() => Type.assertObject({}));
  t.throws(() => Type.assertObject(null));
  t.throws(() => Type.assertObject([]));
  t.throws(() => Type.assertObject(() => {}));
});

test("isNull, assertNull", (t) => {
  t.assert(Type.isNull(null));
  t.assert(!Type.isNull(undefined));

  t.notThrows(() => Type.assertNull(null));
  t.throws(() => Type.assertNull(undefined));
});

test("isUndefined, assertUndefined", (t) => {
  t.assert(Type.isUndefined(undefined));
  t.assert(!Type.isUndefined(null));

  t.notThrows(() => Type.assertUndefined(undefined));
  t.throws(() => Type.assertUndefined(null));
});

test("isEmpty, assertEmpty", (t) => {
  t.assert(Type.isEmpty(undefined));
  t.assert(Type.isEmpty(null));
  t.assert(!Type.isEmpty(false));
  t.assert(!Type.isEmpty(0));
  t.assert(!Type.isEmpty(""));
  t.assert(!Type.isEmpty([]));

  t.notThrows(() => Type.assertEmpty(undefined));
  t.notThrows(() => Type.assertEmpty(null));
  t.throws(() => Type.assertEmpty(false));
  t.throws(() => Type.assertEmpty(0));
  t.throws(() => Type.assertEmpty(""));
  t.throws(() => Type.assertEmpty([]));
});
