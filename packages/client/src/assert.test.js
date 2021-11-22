import { assert } from "./assert.js";

test("asserts number types", () => {
  expect(() => assert(5).number().integer().min(2).max(4)).toThrowError(
    /Expected a number/
  );
});

test("asserts string types", () => {
  expect(() => assert(5).string()).toThrow();
  expect(() => assert("5").string().length(2)).toThrowError(
    /Expected a 2 character string/
  );
});
