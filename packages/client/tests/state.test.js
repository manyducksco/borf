// import { state } from "../dist/woof";

test("get, set and listen signatures", () => {
  const value = state(5);

  expect(value()).toBe(5);

  const cancel = value((value) => {
    expect(value).toBe(8);
    expect(value).not.toBe(12);
  });

  value(8);
  expect(value()).toBe(8);

  cancel();

  value(12);
  expect(value()).toBe(12);
});

test("state.map", () => {
  const value = state(5);
  const mapped = state.map(value, (n) => n * 2);

  expect(value()).toBe(5);
  expect(mapped()).toBe(10);

  value(2);

  expect(value()).toBe(2);
  expect(mapped()).toBe(4);

  value(6);

  expect(value()).toBe(6);
  expect(mapped()).toBe(12);
});

test("state.filter", () => {
  const value = state(9);
  const filtered = state.filter(value, (n) => n % 2 === 0);

  expect(filtered()).toBe(undefined);

  value(2);

  expect(value()).toBe(2);
  expect(filtered()).toBe(2);

  value(5);

  expect(value()).toBe(5);
  expect(filtered()).toBe(2);

  value(4);

  expect(value()).toBe(4);
  expect(filtered()).toBe(4);

  value(7);

  expect(value()).toBe(7);
  expect(filtered()).toBe(4);
});
