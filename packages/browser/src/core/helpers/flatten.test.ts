import test from "ava";
import { flatten } from "./flatten.js";

test("merges nested arrays of any depth to a single array", (t) => {
  t.deepEqual(flatten([1, ["two", [3, [4], "three"], 2], "one"]), [1, "two", 3, 4, "three", 2, "one"]);
});
