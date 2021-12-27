import { createState } from "./createState.js";

test("get, set and watch", () => {
  const state = createState(5);

  expect(state.get()).toBe(5);

  const cancel = state.watch((value) => {
    expect(value).toBe(8);
    expect(value).not.toBe(12);
  });

  state.set(8);
  expect(state.get()).toBe(8);

  cancel();

  state.set(12);
  expect(state.get()).toBe(12);
});

test("methods object", () => {
  const count = createState(31, {
    methods: {
      increment: (current) => current + 1,
      decrement: (current) => current - 1,
      add: (current, amount) => current + amount,
      subtract: (current, amount) => current - amount,
    },
  });

  count.increment();
  expect(count.get()).toBe(32);

  count.decrement();
  expect(count.get()).toBe(31);

  count.add(5);
  expect(count.get()).toBe(36);

  count.subtract(3);
  expect(count.get()).toBe(33);
});

test("settable", () => {
  const state = createState(5, {
    settable: false,
    methods: {
      inc: (current) => current + 1,
      dec: (current) => current - 1,
    },
  });

  expect(state.get()).toBe(5);

  state.inc();

  expect(state.get()).toBe(6);

  state.inc(); // 7
  state.inc(); // 8
  state.dec(); // 7

  expect(state.get()).toBe(7);

  expect(() => state.set(6)).toThrowError(/state is not settable/);
});
