import { omit } from "./omit.js";

test("clones an object without the specified keys", () => {
  const obj = {
    one: 1,
    two: 2,
    three: 3,
  };

  expect(omit(["one", "three"], obj)).toStrictEqual({ two: 2 });
  expect(omit(["two"], obj)).toStrictEqual({ one: 1, three: 3 });
});
