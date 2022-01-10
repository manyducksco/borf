import { deepEqual } from "./deepEqual.js";

test("tests deep equality of two values", () => {
  expect(deepEqual(1, 2)).toBe(false);
  expect(deepEqual({}, {})).toBe(true);
  expect(deepEqual([1, 2], [1, 2])).toBe(true);
  expect(deepEqual("string1", "string2")).toBe(false);
  expect(deepEqual({}, [])).toBe(false);
});
