import { merge } from "./merge";

test("merges nested objects", () => {
  const original = {
    number: 1,
    object: {
      oldProp: "unchanged",
      nested: {
        isNested: true,
      },
    },
    array: [1, 2, 3],
    changeMyType: "from a string",
  };

  const target = {
    number: 2,
    object: {
      newProp: "hello",
      nested: {
        veryNested: {
          isVeryNested: true,
        },
      },
    },
    array: [1, 2, 4],
    changeMyType: { now: "it's an object" },
  };

  const merged = merge(original, target);

  expect(merged).toStrictEqual({
    number: 2,
    object: {
      oldProp: "unchanged",
      newProp: "hello",
      nested: {
        isNested: true,
        veryNested: {
          isVeryNested: true,
        },
      },
    },
    array: [1, 2, 4],
    changeMyType: { now: "it's an object" },
  });
});
