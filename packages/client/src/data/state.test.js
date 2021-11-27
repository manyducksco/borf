import { state } from "./state.js";

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

test("listener can be cancelled from within", () => {
  const value = state(5);

  value((n, cancel) => {
    expect(n).toBe(10);
    cancel(); // cancelled after first value is received
  });

  value(10);
  value(20); // not received
});

test("methods object", () => {
  const count = state(31, {
    increment: (value) => value + 1,
    decrement: (value) => value - 1,
    add: (value, amount) => value + amount,
    subtract: (value, amount) => value - amount,
  });

  count.increment();
  expect(count()).toBe(32);

  count.decrement();
  expect(count()).toBe(31);

  count.add(5);
  expect(count()).toBe(36);

  count.subtract(3);
  expect(count()).toBe(33);
});

test("state.immut", () => {
  const value = state.immut(5, {
    inc: (value) => value + 1,
    dec: (value) => value - 1,
  });

  expect(value()).toBe(5);
  value.inc();
  expect(value()).toBe(6);
  value.inc().inc().dec();
  expect(value()).toBe(7);

  expect(() => value(6)).toThrowError(
    /Immutable states cannot be directly set/
  );
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
