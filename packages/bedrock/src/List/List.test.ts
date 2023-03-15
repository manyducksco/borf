import test from "ava";
import { List } from "./List.js";

type Cat = {
  id: number;
  name: string;
};

test("static isList", (t) => {
  const array = [1, 2, 3];
  const list = new List(array);

  t.assert(List.isList(list));
  t.assert(!List.isList(array));
  t.assert(!List.isList({}));
});

test("static firstOf / lastOf", (t) => {
  const array = [1, 2, 3];
  const list = new List(array);

  t.is(List.firstOf(array), 1);
  t.is(List.firstOf(list), 1);

  t.is(List.lastOf(array), 3);
  t.is(List.lastOf(list), 3);
});

test("append / remove", (t) => {
  const cats = new List<Cat>(
    [
      { id: 1, name: "Bon" },
      { id: 2, name: "Tim" },
    ],
    {
      isEqual(item, other: any) {
        return item.id === other?.id;
      },
    }
  );

  cats.append({ id: 3, name: "Justin" });
  t.is(cats.length, 3);

  cats.remove({ id: 3, name: "Justin" });
  t.is(cats.length, 2);
});

test("removeWhere", (t) => {
  const numbers = new List([1, 2, 3, 4, 5, 6, 7, 8]);

  // Remove odd numbers.
  numbers.removeWhere((n) => n % 2 !== 0);

  t.deepEqual([...numbers.values()], [2, 4, 6, 8]);
});

test("keepFirst", (t) => {
  const numbers = new List([1, 2, 3, 4, 5, 6, 7, 8]);

  numbers.keepFirst(5);

  t.deepEqual([...numbers.values()], [1, 2, 3, 4, 5]);
});

test("keepLast", (t) => {
  const numbers = new List([1, 2, 3, 4, 5, 6, 7, 8]);

  numbers.keepLast(5);

  t.deepEqual([...numbers.values()], [4, 5, 6, 7, 8]);
});

test("dropFirst", (t) => {
  const numbers = new List([1, 2, 3, 4, 5, 6, 7, 8]);

  numbers.dropFirst(5);

  t.deepEqual([...numbers.values()], [6, 7, 8]);
});

test("dropLast", (t) => {
  const numbers = new List([1, 2, 3, 4, 5, 6, 7, 8]);

  numbers.dropLast(5);

  t.deepEqual([...numbers.values()], [1, 2, 3]);
});
