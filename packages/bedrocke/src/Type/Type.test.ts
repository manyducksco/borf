import test from "ava";
import Symbol_observable from "symbol-observable";
import { Type } from "./Type.js";
import { Observable } from "../Observable/Observable.js";
import { Hash } from "../Hash/Hash.js";

test("isArray", (t) => {
  t.assert(Type.isArray([]));
  t.assert(!Type.isArray({}));
  t.assert(!Type.isArray({ 0: "zero", 1: "one", length: 2 }));
  t.assert(!Type.isArray(5));
});

test("isArrayOf", (t) => {
  const numbers = [1, 2, 3];
  const strings = ["dog", "cat", "duck"];

  t.assert(Type.isArrayOf(Type.isNumber, numbers));
  t.assert(Type.isArrayOf(Type.isString, strings));
  t.assert(!Type.isArrayOf(Type.isNumber, strings));

  const isNumberArray = Type.isArrayOf(Type.isNumber);

  t.assert(Type.isFunction(isNumberArray));
  t.assert(isNumberArray(numbers));
  t.assert(!isNumberArray(strings));
});

test("isBoolean", (t) => {
  t.assert(Type.isBoolean(true));
  t.assert(Type.isBoolean(false));
  t.assert(!Type.isBoolean("true"));
  t.assert(!Type.isBoolean(0));
});

test("isString", (t) => {
  t.assert(Type.isString(""));
  t.assert(Type.isString("Hello"));
  t.assert(!Type.isString(5));
  t.assert(!Type.isString(["c", "h", "a", "r", "s"]));
});

test("isFunction", (t) => {
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
});

test("isNumber", (t) => {
  t.assert(Type.isNumber(1));
  t.assert(!Type.isNumber("5"));
  t.assert(!Type.isNumber(BigInt(5)));
});

test("isInteger", (t) => {
  t.assert(Type.isInteger(23));
  t.assert(!Type.isInteger(1.5));
});

test("isBigInt", (t) => {
  t.assert(Type.isBigInt(BigInt(5)));
  t.assert(!Type.isBigInt(5));
});

test("isClass", (t) => {
  class Example {}
  const instance = new Example();

  t.assert(Type.isClass(Example));
  t.assert(!Type.isClass(instance));
});

test("extends", (t) => {
  class SuperClass {}
  class OtherClass {}
  class SubClass extends SuperClass {}
  const instance = new SubClass();

  const extendsSuperClass = Type.extends(SuperClass);

  t.assert(extendsSuperClass(SubClass));
  t.assert(!extendsSuperClass(OtherClass));
  t.assert(!extendsSuperClass(instance)); // Instances are not a class.

  t.assert(Type.extends(SuperClass, SubClass));
  t.assert(!Type.extends(SuperClass, OtherClass));
  t.assert(!Type.extends(SuperClass, instance));
});

test("isPromise", (t) => {
  const promise = Promise.resolve();
  const promiseLike = {
    then() {},
    catch() {},
    finally() {},
  };

  t.assert(Type.isPromise(promise));
  t.assert(Type.isPromise(promiseLike));
  t.assert(!Type.isPromise("donuts"));
});

test("isInstanceOf", (t) => {
  class Example {}
  class SubExample extends Example {}

  const example = new Example();
  const subExample = new SubExample();

  t.assert(Type.isInstanceOf(Example, example));
  t.assert(Type.isInstanceOf(SubExample, subExample));
  t.assert(Type.isInstanceOf(Example, subExample));

  const isExample = Type.isInstanceOf(Example);

  t.assert(Type.isFunction(isExample));
  t.assert(isExample(example));
  t.assert(isExample(subExample));
});

test("isMap", (t) => {
  t.assert(Type.isMap(new Map()));
  t.assert(Type.isMap(new Hash()));
  t.assert(!Type.isMap({}));
  t.assert(!Type.isMap(5));
});

test("isSet", (t) => {
  t.assert(Type.isSet(new Set()));
  t.assert(!Type.isSet(new Map()));
  t.assert(!Type.isSet(undefined));
});

test("isObservable", (t) => {
  // Bedrocke observables are observable.
  t.assert(Type.isObservable(Observable.of([1, 2, 3])));

  // Arbitrary objects that implement the Observable protocol are observable.
  const observable = {
    [Symbol_observable]() {
      return this;
    },

    subscribe(...args: any[]) {
      return {
        unsubscribe() {},
      };
    },
  };

  t.assert(Type.isObservable(observable));

  // Non-observable objects are non-observable.
  t.assert(!Type.isObservable(1));
  t.assert(!Type.isObservable("random string"));
});

test("isIterable", (t) => {
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
});

test("isObject", (t) => {
  t.assert(Type.isObject({}));
  t.assert(!Type.isObject(null));
  t.assert(!Type.isObject([]));
  t.assert(!Type.isObject(() => {}));
});

test("isNull", (t) => {
  t.assert(Type.isNull(null));
  t.assert(!Type.isNull(undefined));
});

test("isUndefined", (t) => {
  t.assert(Type.isUndefined(undefined));
  t.assert(!Type.isUndefined(null));
});

test("isNullish", (t) => {
  t.assert(Type.isNullish(undefined));
  t.assert(Type.isNullish(null));
  t.assert(!Type.isNullish(false));
  t.assert(!Type.isNullish(0));
  t.assert(!Type.isNullish(""));
  t.assert(!Type.isNullish([]));
});
