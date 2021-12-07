import { state } from "./state.js";

test("get, set and listen signatures", () => {
  expect.assertions(9);

  const value = state(5);

  expect(value()).toBe(5);

  const cancel = value((value) => {
    expect(value).toBe(8);
    expect(value).not.toBe(12);
  });

  const context = {
    cancellers: [],
    cancel() {
      for (const cancel of this.cancellers) {
        cancel();
      }
      this.cancellers = [];
    },
  };

  const cancel2 = value(context, (value) => {
    expect(value).toBe(8);
    expect(value).not.toBe(12);
  });

  value(context, (value) => {
    expect(value).toBe(8);
    expect(value).not.toBe(12);
  });

  value(8);
  expect(value()).toBe(8);

  cancel();
  cancel2();
  context.cancel();

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
    methods: {
      increment: (value) => value + 1,
      decrement: (value) => value - 1,
      add: (value, amount) => value + amount,
      subtract: (value, amount) => value - amount,
    },
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

test("immutable", () => {
  const value = state(5, {
    immutable: true,
    methods: {
      inc: (value) => value + 1,
      dec: (value) => value - 1,
    },
  });

  expect(value()).toBe(5);
  value.inc();
  expect(value()).toBe(6);
  value.inc().inc().dec();
  expect(value()).toBe(7);

  expect(() => value(6)).toThrowError(
    /Immutable states can only be set through their methods/
  );
});

test("state.map", () => {
  const value = state(5);
  const mapped = state.map(value, (n) => n * 2);

  const context = {
    cancellers: [],
    cancel() {
      for (const cancel of this.cancellers) {
        cancel();
      }
      this.cancellers = [];
    },
  };

  const cancel = mapped(context, (value) => {
    expect(value).toBe(4);
    expect(value).not.toBe(12);
  });

  mapped(context, (value) => {
    expect(value).toBe(4);
    expect(value).not.toBe(12);
  });

  expect(value()).toBe(5);
  expect(mapped()).toBe(10);

  value(2);

  expect(value()).toBe(2);
  expect(mapped()).toBe(4);

  cancel();
  context.cancel();

  value(6);

  expect(value()).toBe(6);
  expect(mapped()).toBe(12);
});

test("state.combine", () => {
  const value1 = state(false);
  const value2 = state(true);
  const bothTrue = state.combine(
    value1,
    value2,
    (...args) => !args.some((value) => value === false)
  );

  expect(bothTrue()).toBe(false);

  value1(true);

  expect(bothTrue()).toBe(true);

  value2(false);

  expect(bothTrue()).toBe(false);
});
