import { makeRef } from "./makeRef.js";

test("stores and returns a value", () => {
  const ref = makeRef(12);

  expect(ref()).toBe(12);

  ref(50);

  expect(ref()).toBe(50);

  ref(null);

  expect(ref()).toBe(null);
});
