import test from "ava";
import { Hash } from "./Hash.js";

test("keyOf", (t) => {
  const hash = new Hash([
    ["one", 1],
    ["two", 2],
    ["three", 3],
  ]);

  t.is(hash.keyOf(1), "one");
  t.is(hash.keyOf(2), "two");
  t.is(hash.keyOf(3), "three");
});

test("pick", (t) => {
  const hash = new Hash([
    ["Bon", { fur: "Gray", eyes: "Yellow" }],
    ["Tim", { fur: "Orange", eyes: "Green" }],
    ["Justin", { fur: "Brown/White", eyes: "Amber" }],
  ]);

  const picked = hash.pick(["Tim", "Justin"]);

  t.is(hash.size, 3);
  t.is(picked.size, 2);

  t.falsy(picked.has("Bon"));
  t.truthy(picked.has("Tim"));
  t.truthy(picked.has("Justin"));
});

test("omit", (t) => {
  const hash = new Hash([
    ["Bon", { fur: "Gray", eyes: "Yellow" }],
    ["Tim", { fur: "Orange", eyes: "Green" }],
    ["Justin", { fur: "Brown/White", eyes: "Amber" }],
  ]);

  const omitted = hash.omit(["Justin", "Tim"]);

  t.is(hash.size, 3);
  t.is(omitted.size, 1);

  t.truthy(omitted.has("Bon"));
});

test("map", (t) => {
  const hash = new Hash([
    ["Bon", { fur: "Gray", eyes: "Yellow" }],
    ["Tim", { fur: "Orange", eyes: "Green" }],
    ["Justin", { fur: "Brown/White", eyes: "Amber" }],
  ]);

  const catColors = hash.map(([key, value]) => {
    return [key, value.fur];
  });

  t.is(catColors.get("Bon"), "Gray");
  t.is(catColors.get("Tim"), "Orange");
});

test("filter", (t) => {
  const hash = new Hash([
    ["Bon", { fur: "Gray", eyes: "Yellow" }],
    ["Tim", { fur: "Orange", eyes: "Green" }],
    ["Justin", { fur: "Brown/White", eyes: "Amber" }],
  ]);

  const grayCats = hash.filter(([key, value]) => {
    return value.fur === "Gray";
  });

  t.is(grayCats.size, 1);
  t.deepEqual(grayCats.get("Bon"), {
    fur: "Gray",
    eyes: "Yellow",
  });
});

test("copy", (t) => {
  const hash = new Hash([
    ["Bon", { fur: "Gray", eyes: "Yellow" }],
    ["Tim", { fur: "Orange", eyes: "Green" }],
    ["Justin", { fur: "Brown/White", eyes: "Amber" }],
  ]);

  const copy = hash.copy();

  hash.set("Catniss", { fur: "Tabby", eyes: "Yellow" });

  t.is(hash.size, 4);
  t.is(copy.size, 3); // Copy is a separate object, so wasn't modified.

  const bon = hash.get("Bon")!;

  bon.eyes = "Green";

  t.is(hash.get("Bon")!.eyes, "Green"); // Object was mutated.
  t.is(copy.get("Bon")!.eyes, "Green"); // Copy retains the original reference, therefore sees the mutation.
});

test("clone", (t) => {
  const hash = new Hash([
    ["Bon", { fur: "Gray", eyes: "Yellow" }],
    ["Tim", { fur: "Orange", eyes: "Green" }],
    ["Justin", { fur: "Brown/White", eyes: "Amber" }],
  ]);

  const clone = hash.clone();

  hash.set("Catniss", { fur: "Tabby", eyes: "Yellow" });

  t.is(hash.size, 4);
  t.is(clone.size, 3); // Copy is a separate object, so wasn't modified.

  const bon = hash.get("Bon")!;

  bon.eyes = "Green";

  t.is(hash.get("Bon")!.eyes, "Green"); // Object was mutated.
  t.is(clone.get("Bon")!.eyes, "Yellow"); // Cloned value is a completely different object so retains its original value.
});

test("first / last", (t) => {
  const hash = new Hash([
    ["Bon", { fur: "Gray", eyes: "Yellow" }],
    ["Tim", { fur: "Orange", eyes: "Green" }],
    ["Justin", { fur: "Brown/White", eyes: "Amber" }],
  ]);

  t.deepEqual(hash.first(), ["Bon", { fur: "Gray", eyes: "Yellow" }]);
  t.deepEqual(hash.first(2), [
    ["Bon", { fur: "Gray", eyes: "Yellow" }],
    ["Tim", { fur: "Orange", eyes: "Green" }],
  ]);

  t.deepEqual(hash.last(), ["Justin", { fur: "Brown/White", eyes: "Amber" }]);
  t.deepEqual(hash.last(2), [
    ["Tim", { fur: "Orange", eyes: "Green" }],
    ["Justin", { fur: "Brown/White", eyes: "Amber" }],
  ]);
});
