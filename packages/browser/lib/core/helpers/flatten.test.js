import { flatten } from "./flatten.js";

test("merges nested arrays of any depth to a single array", () => {
  expect(flatten([1, ["two", [3, [4], "three"], 2], "one"])).toStrictEqual([1, "two", 3, 4, "three", 2, "one"]);
});
