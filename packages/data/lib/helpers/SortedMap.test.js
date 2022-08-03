import { SortedMap } from "./SortedMap.js";

test("testing", () => {
  const map = new SortedMap({
    compare: (a, b) => {
      return a[1].order < b[1].order ? -1 : 1;
    },
  });

  const key1 = {};
  const key2 = {};

  map.set(key1, { order: 2, hello: true });
  map.set(key2, { order: 1, goodbye: true });

  expect(map.get(key1)).toStrictEqual({ order: 2, hello: true });
  expect(map.get(key2)).toStrictEqual({ order: 1, goodbye: true });

  map.set(key2, { order: 1, goodbye: false });

  expect(map.get(key2)).toStrictEqual({ order: 1, goodbye: false });

  const records = [];

  for (const [key, value] of map) {
    records.push(value);
  }

  expect(records).toStrictEqual([
    { order: 1, goodbye: false },
    { order: 2, hello: true },
  ]);
});
