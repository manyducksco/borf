import test from "ava";
import { merge } from "./merge.js";

test("merges nested objects", (t) => {
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

  t.deepEqual(merged, {
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
