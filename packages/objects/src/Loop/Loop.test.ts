import test from "ava";
import { Loop } from "./Loop.js";

/* ----- Loop.times() ----- */

test("times", (t) => {
  let calls = 0;

  Loop.times(17, () => {
    calls++;
  });

  t.is(calls, 17);
});

test("times async", async (t) => {
  let calls = 0;

  await Loop.times(10, async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  t.is(calls, 10);
});

/* ----- Loop.each() ----- */

test("each with array", (t) => {});

test("each with object", (t) => {});

test("each with iterable", (t) => {});

/* ----- Loop.until() ----- */

test("until", (t) => {});
test("until async", (t) => {});

/* ----- Loop.batchQueue() ----- */

test("batchQueue", (t) => {});

/* ----- Loop.game() ----- */

test("game", (t) => {
  
});
