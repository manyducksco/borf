import { State } from "./State.js";

describe("new State", () => {
  test("stores and returns a value", () => {
    const $$value = new State(5);

    expect($$value.get()).toBe(5);

    $$value.set("five");

    expect($$value.get()).toBe("five");
  });

  test("converts to readable", () => {
    const $$value = new State(5);
    const $readable = $$value.readable();

    expect($$value.get()).toBe(5);
    expect($readable.get()).toBe(5);

    $$value.set("five");

    expect($readable.get()).toBe("five");
  });

  test("transforms with 'as'", () => {
    const $$value = new State(5);
    const $doubled = $$value.as((x) => x * 2);

    expect($doubled.get()).toBe(10);

    $$value.set(10);

    expect($doubled.get()).toBe(20);

    // Throws an error if no transform function is passed.
    expect(() => {
      $$value.as();
    }).toThrow();
  });

  test("chained transforms with 'as'", () => {
    const $$value = new State(5);
    const $once = $$value.as((x) => x * 2);
    const $twice = $once.as((x) => x * 2);
    const next = jest.fn();

    expect($once.get()).toBe(10);
    expect($twice.get()).toBe(20);

    const subscription = $twice.subscribe(next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(20);

    $$value.set(50);

    expect(next).toHaveBeenCalledTimes(2);
    expect(next).toHaveBeenCalledWith(200);

    subscription.unsubscribe();

    $$value.set(100);

    expect($twice.get()).toBe(400);

    // Not called again after unsubscribe.
    expect(next).toHaveBeenCalledTimes(2);

    // Throws an error if no transform function is passed.
    expect(() => {
      $twice.as();
    }).toThrow();
  });

  test("can update state by mutating (immer)", () => {
    const $$value = new State(["one", "two", "three"]);

    const original = $$value.get();

    $$value.update((list) => {
      list.push("four");
    });

    const updated = $$value.get();

    expect(original).not.toBe(updated);
    expect(updated.length).toBe(4);

    // Throws an error if no update function is passed.
    expect(() => {
      $$value.update();
    }).toThrow();
  });

  test("is observable", () => {
    const $$value = new State(5);
    const next = jest.fn();

    const subscription = $$value.subscribe({ next });

    // Emits current value to observers on subscribe.
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(5);

    $$value.set(10);

    expect(next).toHaveBeenCalledTimes(2);
    expect(next).toHaveBeenCalledWith(10);

    subscription.unsubscribe();

    $$value.set(20);

    // Not called again after unsubscribe.
    expect(next).toHaveBeenCalledTimes(2);
  });

  test("observer gets initial value even if it's undefined", () => {
    const $$value = new State();
    const next = jest.fn();

    const subscription = $$value.subscribe({ next });

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(undefined);

    subscription.unsubscribe();
  });
});

describe("State.merge", () => {
  test("joins multiple states", () => {
    const $$one = new State(2);
    const $$two = new State(4);
    const $$three = new State(8);

    const joinFirst = jest.fn((one, two) => {
      return one + two;
    });
    const $first = State.merge($$one, $$two, joinFirst);

    const joinSecond = jest.fn((one, two, three) => {
      return one + two + three;
    });
    const $second = State.merge($$one, $$two, $$three, joinSecond);

    expect($first.get()).toBe(6);
    expect($second.get()).toBe(14);

    expect(joinFirst).toHaveBeenCalledTimes(1);
    expect(joinSecond).toHaveBeenCalledTimes(1);

    const next = jest.fn();
    const subscription = $second.subscribe(next);

    expect(next).toHaveBeenCalledTimes(1); // Observer receives initial value.
    expect(next).toHaveBeenCalledWith(14);

    expect(joinSecond).toHaveBeenCalledTimes(2);

    $$two.set(16);

    expect(joinFirst).toHaveBeenCalledTimes(1);
    expect(joinSecond).toHaveBeenCalledTimes(3);

    expect($first.get()).toBe(18);
    expect($second.get()).toBe(26);

    expect(joinFirst).toHaveBeenCalledTimes(2);
    expect(joinSecond).toHaveBeenCalledTimes(3);

    expect(next).toHaveBeenCalledTimes(2); // Observer received value.
    expect(next).toHaveBeenCalledWith(26);

    subscription.unsubscribe();

    $$one.set(32);

    expect($first.get()).toBe(48);
    expect($second.get()).toBe(56);

    expect(joinFirst).toHaveBeenCalledTimes(3);
    expect(joinSecond).toHaveBeenCalledTimes(4);

    expect(next).toHaveBeenCalledTimes(2); // Not called after unsubscribe.
  });

  test("observers of 'undefined' value receive value once", () => {
    const $$one = new State(true);
    const $$two = new State(false);

    const $joined = State.merge($$one, $$two, (one, two) => {
      if (one && two) {
        return true;
      }
      if (!one && !two) {
        return false;
      }
    });

    expect($joined.get()).toBe(undefined);

    const next = jest.fn();
    const subscription = $joined.subscribe(next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(undefined);

    $$two.set(true);

    expect($joined.get()).toBe(true);

    expect(next).toHaveBeenCalledTimes(2);
    expect(next).toHaveBeenCalledWith(true);

    $$one.set(false);

    expect($joined.get()).toBe(undefined);

    expect(next).toHaveBeenCalledTimes(3);
    expect(next).toHaveBeenCalledWith(undefined);

    subscription.unsubscribe();

    $$two.set(false);

    expect($joined.get()).toBe(false);

    expect(next).toHaveBeenCalledTimes(3); // Not called again after unsubscribe.
  });

  test("throws if no merge function is passed", () => {
    const $$one = new State(1);
    const $$two = new State(2);

    expect(() => {
      State.merge($$one, $$two);
    }).toThrow();
  });

  test("transform with 'as'", () => {
    const $$one = new State(1);
    const $$two = new State(2);

    const $joined = State.merge($$one, $$two, (one, two) => one + two);
    const $doubled = $joined.as((x) => x * 2);

    expect($doubled.get()).toBe(6);

    $$one.set(4);

    expect($doubled.get()).toBe(12);

    expect(() => {
      $joined.as();
    }).toThrow();
  });
});
