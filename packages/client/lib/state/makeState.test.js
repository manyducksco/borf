import { makeState } from "./makeState.js";

// TODO: Make sure mapped state watchers only fire when their value is actually different than the last time.

describe("get", () => {
  test("gets value when called with no args", () => {
    const $state = makeState(5);
    expect($state.get()).toBe(5);
  });

  test("gets transformed value when called with a transform function", () => {
    const $state = makeState(5);
    expect($state.get((x) => x * 2)).toBe(10);
  });
});

describe("set", () => {
  test("takes a replacement value", () => {
    const $state = makeState(5);
    $state.set(80);
    expect($state.get()).toBe(80);
  });

  test("takes a function that replaces the value by returning a new value", () => {
    const $state = makeState(10);
    $state.set((current) => {
      return current + 1;
    });
    expect($state.get()).toBe(11);
  });

  test("takes a function that mutates the existing value to create a new value", () => {
    const $state = makeState({ number: 10, word: "ことば" });
    $state.set((current) => {
      current.number = 47;
    });
    expect($state.get()).toStrictEqual({
      number: 47,
      word: "ことば",
    });
  });
});

describe("map", () => {
  test("takes a function; produces a new value by passing it through the function", () => {
    const $count = makeState(1);
    const $doubled = $count.map((x) => x * 2);

    expect($count.get()).toBe(1);
    expect($doubled.get()).toBe(2);

    $count.set(5);

    expect($doubled.get()).toBe(10);
  });

  test("mapped values emit new values only when the mapped portion changes", () => {
    // In other words, updating the state should not re-emit mapped values unless those keys have new values.
    const $coords = makeState({ x: 10, y: -5 });
    const $mapped = $coords.map((coords) => coords.x);

    const watchesMapped = jest.fn();

    $mapped.subscribe(watchesMapped);

    expect($mapped.get()).toBe(10);
    expect(watchesMapped).toHaveBeenCalledWith(10);
    expect(watchesMapped).toHaveBeenCalledTimes(1);

    $coords.set({ x: 15, y: 8 });

    expect($mapped.get()).toBe(15);
    expect(watchesMapped).toHaveBeenCalledWith(15);
    expect(watchesMapped).toHaveBeenCalledTimes(2);

    // This doesn't touch `x` so none of the subscribers should have fired again.
    $coords.set((current) => {
      current.y = -52;
    });

    expect($mapped.get()).toBe(15);
    expect(watchesMapped).toHaveBeenCalledWith(15);
    expect(watchesMapped).toHaveBeenCalledTimes(2);
  });
});

describe("subscribe", () => {
  test("is Observable", () => {
    const $state = makeState(1);

    const next = jest.fn();

    const subscription = $state.subscribe({
      next,
    });

    $state.set(2);
    $state.set(3);
    $state.set(4);

    subscription.unsubscribe();

    $state.set(5);

    expect(next).toHaveBeenCalledTimes(4);
    expect(next).toHaveBeenCalledWith(1);
    expect(next).toHaveBeenCalledWith(2);
    expect(next).toHaveBeenCalledWith(3);
    expect(next).toHaveBeenCalledWith(4);
    expect(next).not.toHaveBeenCalledWith(5);
  });
});

describe("immutability", () => {
  test("state object is immutable", () => {
    const $state = makeState({ label: "original" });

    const value = $state.get();

    expect(value.label).toBe("original");

    value.label = "modified";
    expect(value.label).toBe("original"); // Didn't work.

    expect($state.get().label).toBe("original"); // State still returns original value.

    $state.set((value) => {
      value.label = "modified";
    });

    expect($state.get().label).toBe("modified"); // Value was changed correctly.

    expect($state.get() !== value).toBe(true); // State object was replaced instead of mutated.
  });
});
