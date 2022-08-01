import { deepFreeze } from "./deepFreeze.js";

test("deeply freezes object", () => {
  const object = {
    shallow: "yes",
    nested: {
      arr: [1, 2, 3],
      further: {
        test: false,
      },
    },
  };

  const returned = deepFreeze(object);

  expect(object).toBe(returned);

  object.shallow = "no";
  object.nested.arr[1] = 5;
  object.nested.further.test = true;

  expect(object.shallow).toBe("yes");
  expect(object.nested.arr).toStrictEqual([1, 2, 3]);
  expect(object.nested.further.test).toBe(false);
});
