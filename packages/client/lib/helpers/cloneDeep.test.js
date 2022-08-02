import { cloneDeep } from "./cloneDeep";

test("clones objects", () => {
  const original = {
    firstLevel: {
      string: "string",
      secondLevel: {
        thirdLevel: {
          array: [1, 2, 3],
        },
      },
    },
  };

  const clone = cloneDeep(original);

  expect(clone).toStrictEqual(original);

  clone.firstLevel.string = "changed";
  clone.firstLevel.secondLevel.thirdLevel.array[2] = 5;

  expect(clone).not.toStrictEqual(original);
});

test("returns non-objects as is", () => {
  const num = 5;
  const str = "a string";
  const fn = () => {};

  expect(cloneDeep(num)).toBe(num);
  expect(cloneDeep(str)).toBe(str);
  expect(cloneDeep(fn)).toBe(fn);
});
