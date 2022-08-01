import { produce } from "./produce.js";

test("returns value from function", () => {
  const value = {
    test: 5,
  };

  const produced = produce(value, (v) => {
    return {
      test: 7,
    };
  });

  expect(produced.test).toBe(7);
  expect(value.test).toBe(5);
});

test("returns mutated clone if function returns undefined", () => {
  const value = {
    test: 5,
  };

  const produced = produce(value, (v) => {
    v.test = 7;
  });

  expect(produced.test).toBe(7);
  expect(value.test).toBe(5);
});
