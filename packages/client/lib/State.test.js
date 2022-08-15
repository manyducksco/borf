import { State } from "./State.js";

// TODO: Make sure mapped state watchers only fire when their value is actually different than the last time.

describe("get", () => {
  test("gets value when called with no args", () => {
    const $state = new State(5);
    expect($state.get()).toBe(5);
  });

  test("gets selected value when called with a selector string", () => {
    const $state = new State({
      number: 12,
      array: [{ name: "one" }, { name: "two" }],
    });
    expect($state.get("number")).toBe(12);
    expect($state.get("array[1].name")).toBe("two");
    expect($state.get("array[*].name")).toStrictEqual(["one", "two"]);
  });

  test("gets transformed value when called with a transform function", () => {
    const $state = new State(5);
    expect($state.get((x) => x * 2)).toBe(10);
  });

  test("gets selected and transformed value when called with a selector string and a transform function", () => {
    const $state = new State({
      number: 12,
      array: [{ name: "one" }, { name: "two" }],
    });
    expect($state.get("number", (x) => x * 2)).toBe(24);
    expect($state.get("array[1].name", (x) => x.toUpperCase())).toBe("TWO");
    expect(
      $state.get("array[*].name", (names) => {
        return names.map((name) => name.toUpperCase());
      })
    ).toStrictEqual(["ONE", "TWO"]);
  });
});

describe("set", () => {
  test("takes a replacement value", () => {
    const $state = new State(5);
    $state.set(80);
    expect($state.get()).toBe(80);
  });

  test("takes a function that replaces the value by returning a new value", () => {
    const $state = new State(10);
    $state.set((current) => {
      return current + 1;
    });
    expect($state.get()).toBe(11);
  });

  test("takes a function that mutates the existing value to create a new value", () => {
    const $state = new State({ number: 10, word: "ことば" });
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
    const $count = new State(1);
    const $doubled = $count.map((x) => x * 2);

    expect($count.get()).toBe(1);
    expect($doubled.get()).toBe(2);

    $count.set(5);

    expect($doubled.get()).toBe(10);
  });

  test("takes a string; selects a new value with a selector string", () => {
    const $name = new State({
      name: {
        first: "a",
        last: "b",
      },
    });
    const $firstName = $name.map("name.first");

    expect($firstName.get()).toBe("a");

    $name.set((current) => {
      current.name.first = "Bob";
    });

    expect($firstName.get()).toBe("Bob");
  });

  test("takes a string and a function; selects a value and passes it through the function", () => {
    const $name = new State({
      name: {
        first: "a",
        last: "b",
      },
    });
    const $firstName = $name.map("name.first", (value) => value.toUpperCase());

    expect($firstName.get()).toBe("A");

    $name.set((current) => {
      current.name.first = "Bob";
    });

    expect($firstName.get()).toBe("BOB");
  });

  test("advanced [*] selector", () => {
    const $person = new State({
      name: {
        first: "Jimbo",
        last: "Jones",
      },
      friends: [
        {
          name: {
            first: "Steve",
            last: "Jobs",
          },
          friends: [
            {
              name: {
                first: "Jony",
                last: "Ive",
              },
            },
          ],
        },
        {
          name: {
            first: "Steve",
            last: "Wozniak",
          },
          friends: [
            {
              name: {
                first: "Steve",
                last: "Jobs",
              },
            },
          ],
        },
      ],
    });

    const $arrayNames = $person.map("friends[*].name.last");
    const $doubleArrayNames = $person.map("friends[*].friends[*].name.first");

    expect($arrayNames.get()).toStrictEqual(["Jobs", "Wozniak"]);
    expect($doubleArrayNames.get()).toStrictEqual([["Jony"], ["Steve"]]);
  });

  test("mapped values emit new values only when the mapped portion changes", () => {
    // In other words, updating the state should not re-emit mapped values unless those keys have new values.
    const $coords = new State({ x: 10, y: -5 });
    const $mappedWithKey = $coords.map("x");
    const $mappedWithFunction = $coords.map((current) => current.x);
    const $mappedWithKeyAndFunction = $coords.map("x", (x) => x * 2);

    const watchesMappedWithKey = jest.fn();
    const watchesMappedWithFunction = jest.fn();
    const watchesMappedWithKeyAndFunction = jest.fn();

    $mappedWithKey.subscribe(watchesMappedWithKey);
    $mappedWithFunction.subscribe(watchesMappedWithFunction);
    $mappedWithKeyAndFunction.subscribe(watchesMappedWithKeyAndFunction);

    expect($mappedWithKey.get()).toBe(10);
    expect($mappedWithFunction.get()).toBe(10);
    expect($mappedWithKeyAndFunction.get()).toBe(20);
    expect(watchesMappedWithKey).toHaveBeenCalledWith(10);
    expect(watchesMappedWithKey).toHaveBeenCalledTimes(1);
    expect(watchesMappedWithFunction).toHaveBeenCalledWith(10);
    expect(watchesMappedWithFunction).toHaveBeenCalledTimes(1);
    expect(watchesMappedWithKeyAndFunction).toHaveBeenCalledWith(20);
    expect(watchesMappedWithKeyAndFunction).toHaveBeenCalledTimes(1);

    $coords.set({ x: 15, y: 8 });

    expect($mappedWithKey.get()).toBe(15);
    expect($mappedWithFunction.get()).toBe(15);
    expect($mappedWithKeyAndFunction.get()).toBe(30);
    expect(watchesMappedWithKey).toHaveBeenCalledWith(15);
    expect(watchesMappedWithKey).toHaveBeenCalledTimes(2);
    expect(watchesMappedWithFunction).toHaveBeenCalledWith(15);
    expect(watchesMappedWithFunction).toHaveBeenCalledTimes(2);
    expect(watchesMappedWithKeyAndFunction).toHaveBeenCalledWith(30);
    expect(watchesMappedWithKeyAndFunction).toHaveBeenCalledTimes(2);

    // This doesn't touch `x` so none of the subscribers should have fired again.
    $coords.set((current) => {
      current.y = -52;
    });

    expect($mappedWithKey.get()).toBe(15);
    expect($mappedWithFunction.get()).toBe(15);
    expect($mappedWithKeyAndFunction.get()).toBe(30);
    expect(watchesMappedWithKey).toHaveBeenCalledWith(15);
    expect(watchesMappedWithKey).toHaveBeenCalledTimes(2);
    expect(watchesMappedWithFunction).toHaveBeenCalledWith(15);
    expect(watchesMappedWithFunction).toHaveBeenCalledTimes(2);
    expect(watchesMappedWithKeyAndFunction).toHaveBeenCalledWith(30);
    expect(watchesMappedWithKeyAndFunction).toHaveBeenCalledTimes(2);
  });
});

describe("subscribe", () => {
  test("is Observable", () => {
    const $state = new State(1);

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
    const $state = new State({ label: "original" });

    const value = $state.get();

    expect(value.label).toBe("original");

    value.label = "modified";

    // State still returns original object.
    expect($state.get().label).toBe("original");

    $state.set((value) => {
      value.label = "modified";
    });

    // Value was changed correctly.
    expect($state.get().label).toBe("modified");

    // State object was replaced instead of mutated.
    expect($state.get() !== value).toBe(true);
  });
});

describe("merge", () => {
  test("a", () => {
    const $one = new State(1);
    const $two = new State(2);
    const $three = new State(3);

    const merged = State.merge($one, $two);

    const $sum = merged.into((one, two) => {
      return one + two;
    });

    expect($sum.get()).toBe(3);

    // .with() creates a new merge with the additional state
    const $withed = merged.with($three).into((one, two, three) => {
      return one + two + three;
    });

    expect($withed.get()).toBe(6);
    expect($sum.get()).toBe(3);
  });
});
