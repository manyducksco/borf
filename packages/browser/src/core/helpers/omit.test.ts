import test from "ava";
import { omit } from "./omit.js";

test("clones an object without the specified keys", (t) => {
  const obj = {
    one: 1,
    two: 2,
    three: 3,
  };

  t.deepEqual(omit(["one", "three"], obj), { two: 2 });
  t.deepEqual(omit(["two"], obj), { one: 1, three: 3 });
});
