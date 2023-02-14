import test from "ava";
import { List } from "./List.js";

type Cat = {
  id: number;
  name: string;
};

test("adding and removing", (t) => {
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
