import { deepEqual } from "./deepEqual.js";

test("tests deep equality of two values", () => {
  expect(deepEqual(1, 2)).toBe(false);
  expect(deepEqual({}, {})).toBe(true);
  expect(deepEqual({ one: "1" }, { one: 1 })).toBe(false);
  expect(deepEqual({ one: "1" }, { one: "1", two: "2" })).toBe(false);
  expect(deepEqual([1, 2], [1, 2])).toBe(true);
  expect(deepEqual([1, 2, 3], [1, 2])).toBe(false);
  expect(deepEqual([1, 2, 3], [1, 3, 5])).toBe(false);
  expect(deepEqual([[], {}, []], [[], {}, []])).toBe(true);
  expect(deepEqual([[], { same: "yes" }, []], [[], { same: "no" }, []])).toBe(false);
  expect(deepEqual("string1", "string2")).toBe(false);
  expect(deepEqual({}, [])).toBe(false);
});
