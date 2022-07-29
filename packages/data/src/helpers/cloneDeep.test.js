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

  expect(original).toStrictEqual(clone);

  clone.firstLevel.string = "changed";
  clone.firstLevel.secondLevel.thirdLevel.array[2] = 5;

  expect(original).not.toStrictEqual(clone);
});
