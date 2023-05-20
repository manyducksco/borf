import test from "ava";
import { deepEqual } from "./deepEqual.js";

test("deep equality of two values", (t) => {
  t.is(deepEqual(1, 2), false);
  t.is(deepEqual({}, {}), true);
  t.is(deepEqual({ one: "1" }, { one: 1 }), false);
  t.is(deepEqual({ one: "1" }, { one: "1", two: "2" }), false);
  t.is(deepEqual([1, 2], [1, 2]), true);
  t.is(deepEqual([1, 2, 3], [1, 2]), false);
  t.is(deepEqual([1, 2, 3], [1, 3, 5]), false);
  t.is(deepEqual([[], {}, []], [[], {}, []]), true);
  t.is(deepEqual([[], { same: "yes" }, []], [[], { same: "no" }, []]), false);
  t.is(deepEqual("string1", "string2"), false);
  t.is(deepEqual({}, []), false);
});

test("class instances are compared by identity", (t) => {
  class Test {
    value: number;

    constructor(value: number) {
      this.value = value;
    }
  }

  t.is(deepEqual({ value: 1 }, { value: 1 }), true);
  t.is(deepEqual(new Test(1), new Test(1)), false);
});
