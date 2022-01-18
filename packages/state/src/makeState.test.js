import { makeState } from "./makeState.js";

test("get, set and watch", () => {
  const $state = makeState(5);

  expect($state.get()).toBe(5);
  expect($state.get((current) => current + 2)).toBe(7);

  const unwatch = $state.watch((value) => {
    expect(value).toBe(8);
    expect(value).not.toBe(12);
  });

  $state.set(8);
  expect($state.get()).toBe(8);

  unwatch();

  $state.set(12);
  expect($state.get()).toBe(12);
});

test("map with function", () => {
  const $count = makeState(1);
  const $doubled = $count.map((x) => x * 2);

  expect($count.get()).toBe(1);
  expect($doubled.get()).toBe(2);

  $count.set(5);

  expect($doubled.get()).toBe(10);
});

test("map with key", () => {
  const $name = makeState({
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

test("map with key and function", () => {
  const $name = makeState({
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

test("map with [*] selector", () => {
  const $person = makeState({
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

test("watch with function", () => {
  expect.assertions(1);

  const name = makeState({
    name: {
      first: "a",
      last: "b",
    },
  });

  name.watch((value) => {
    expect(value.name.first).toBe("TEST");
  });

  name.set((current) => {
    current.name.first = "TEST";
  });
});

test("watch with key", () => {
  expect.assertions(1);

  const name = makeState({
    name: {
      first: "a",
      last: "b",
    },
  });

  name.watch("name.first", (value) => {
    expect(value).toBe("TEST");
  });

  name.set((current) => {
    current.name.first = "TEST";
  });
});
