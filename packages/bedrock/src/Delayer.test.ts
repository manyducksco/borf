import test from "ava";
import sinon from "sinon";
import { Delayer } from "./Delayer.js";

test("delays a callback", (t) => {
  t.plan(2);
  t.timeout(100);

  const delayer = new Delayer();
  let called = false;

  delayer.delay(20, () => {
    called = true;
    t.true(called);
  });

  t.false(called);
});

test("callback is cancellable", (t) => {
  t.plan(1);
  t.timeout(100);

  const delayer = new Delayer();
  let called = false;

  delayer.delay(20, () => {
    called = true;
    t.true(called); // Does not run.
  });

  t.false(called);

  delayer.cancel();
});

test("callback can be triggered early", (t) => {
  t.plan(2);
  t.timeout(100);

  const delayer = new Delayer();
  let called = false;

  delayer.delay(20, () => {
    called = true;
  });

  t.false(called);
  delayer.trigger();
  t.true(called);
});

// test("subsequent calls to delay replace previous callback and reset timer", (t) => {});
