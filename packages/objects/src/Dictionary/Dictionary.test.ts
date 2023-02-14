import test from "ava";
import { Dictionary } from "./Dictionary.js";

test("pick", (t) => {
  const dict = new Dictionary([
    ["Bon", { fur: "Gray", eyes: "Yellow" }],
    ["Tim", { fur: "Orange", eyes: "Green" }],
    ["Justin", { fur: "Brown/White", eyes: "Amber" }],
  ]);

  const picked = dict.pick(["Tim", "Justin"]);

  t.is(dict.size, 3);
  t.is(picked.size, 2);

  t.falsy(picked.has("Bon"));
  t.truthy(picked.has("Tim"));
  t.truthy(picked.has("Justin"));
});

test("map", (t) => {
  const dict = new Dictionary([
    ["Bon", { fur: "Gray", eyes: "Yellow" }],
    ["Tim", { fur: "Orange", eyes: "Green" }],
    ["Justin", { fur: "Brown/White", eyes: "Amber" }],
  ]);

  const catColors = dict.map(([key, value]) => {
    return [key, value.fur];
  });

  t.is(catColors.get("Bon"), "Gray");
  t.is(catColors.get("Tim"), "Orange");
});

test("filter", (t) => {
  const dict = new Dictionary([
    ["Bon", { fur: "Gray", eyes: "Yellow" }],
    ["Tim", { fur: "Orange", eyes: "Green" }],
    ["Justin", { fur: "Brown/White", eyes: "Amber" }],
  ]);

  const grayCats = dict.filter(([key, value]) => {
    return value.fur === "Gray";
  });

  t.is(grayCats.size, 1);
  t.deepEqual(grayCats.get("Bon"), {
    fur: "Gray",
    eyes: "Yellow",
  });
});
