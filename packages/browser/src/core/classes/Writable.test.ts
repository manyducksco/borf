import test from "ava";
import sinon from "sinon";
import { Readable, Writable } from "./Writable.js";

test("basic functionality test", (t) => {
  const $$writable = new Writable("writable");
  const $readable = new Readable("test");
  const $x = $readable.map((v) => v.toUpperCase());
  const $y = new Readable($$writable);

  const $merged = Readable.merge([$x, $y], (x, y) => {
    return x + y;
  });

  t.is($merged.value, "TESTwritable");

  const observer = sinon.fake();
  const stop = $$writable.observe(observer);

  $$writable.value = "new value";
  $$writable.value = "new value 2";

  t.is($$writable.value, "new value 2");
  t.is($merged.value, "TESTnew value 2");

  stop();

  $$writable.value = "can you hear me now?";

  t.is($$writable.value, "new value 2");
  t.is($merged.value, "TESTnew value 2");

  t.assert(observer.calledThrice);
  observer.calledOnceWith("writable");
  observer.calledOnceWith("new value");
  observer.calledOnceWith("new value 2");
});

test("stores and returns a value", (t) => {
  const $$value = new Writable(5);

  t.is($$value.value, 5);

  $$value.value = 12;

  t.is($$value.value, 12);
});

test("converts to readable", (t) => {
  const $$value = new Writable(5);
  const $readable = $$value.toReadable();

  t.is($$value.value, 5);
  t.is($readable.value, 5);

  $$value.value = 72;

  t.is($readable.value, 72);
});

test("transforms with 'map'", (t) => {
  const $$number = new Writable(5);
  const $doubled = $$number.map((x) => x * 2);

  t.is($doubled.value, 10);

  $$number.value = 10;

  t.is($doubled.value, 20);
});

test("chained transforms with 'map'", (t) => {
  const $$number = new Writable(5);
  const $doubled = $$number.map((x) => x * 2);
  const $quadrupled = $doubled.map((x) => x * 2);
  const observer = sinon.fake();

  t.is($doubled.value, 10);
  t.is($quadrupled.value, 20);

  const stop = $quadrupled.observe(observer);

  t.assert(observer.calledOnceWith(20));

  $$number.value = 50;

  t.assert(observer.calledTwice);
  t.assert(observer.calledWith(200));

  stop();

  $$number.value = 100;

  t.is($quadrupled.value, 400);

  // Not called again after stop().
  t.assert(observer.calledTwice);
});

test("can update state by mutating (immer)", (t) => {
  const $$numbers = new Writable(["one", "two", "three"]);

  const original = $$numbers.value;

  $$numbers.update((list) => {
    list.push("four");
  });

  const updated = $$numbers.value;

  t.notDeepEqual(original, updated);
  t.is(updated.length, 4);
});

test("observer gets initial value when registered", (t) => {
  const $$value = new Writable(1);
  const observer = sinon.fake();

  const stop = $$value.observe(observer);

  t.assert(observer.calledOnceWithExactly(1));
  t.assert(observer.calledWith(1));

  stop();
});

test("Readable.merge", (t) => {
  const $$one = new Writable(2);
  const $$two = new Writable(4);
  const $$three = new Writable(8);

  const joinFirst = sinon.fake((one: number, two: number) => {
    return one + two;
  });
  const $first = Readable.merge([$$one, $$two], joinFirst);

  const joinSecond = sinon.fake((one: number, two: number, three: number) => {
    return one + two + three;
  });
  const $second = Readable.merge([$$one, $$two, $$three], joinSecond);

  t.is($first.value, 6);
  t.is($second.value, 14);

  t.assert(joinFirst.calledOnce);
  t.assert(joinSecond.calledOnce);

  const observer = sinon.fake();
  const stop = $second.observe(observer);

  t.assert(observer.calledOnceWithExactly(14)); // Observer receives initial value.
  t.assert(joinSecond.calledTwice);

  $$two.value = 16;

  t.assert(joinFirst.calledOnce);
  t.assert(joinSecond.calledThrice);

  t.is($first.value, 18);
  t.is($second.value, 26);

  t.assert(joinFirst.calledTwice);
  t.assert(joinSecond.calledThrice);

  t.assert(observer.calledTwice); // Observer received value.
  t.assert(observer.calledWith(26));

  stop();

  $$one.value = 32;

  t.is($first.value, 48);
  t.is($second.value, 56);

  expect(joinFirst).toHaveBeenCalledTimes(3);
  expect(joinSecond).toHaveBeenCalledTimes(4);

  t.assert(joinFirst.calledThrice);
  t.is(joinSecond.getCalls().length, 4);

  t.assert(observer.calledTwice); // Not called after stop()
});

test("Readable.merge: observers of 'undefined' value receive value once", (t) => {
  const $$one = new Writable(true);
  const $$two = new Writable(false);

  const $joined = Readable.merge([$$one, $$two], (one, two) => {
    if (one && two) {
      return true;
    }
    if (!one && !two) {
      return false;
    }
  });

  t.is($joined.value, undefined);

  const observer = sinon.fake();
  const stop = $joined.observe(observer);

  t.assert(observer.calledOnceWithExactly(undefined));

  $$two.value = true;

  t.is($joined.value, true);

  t.assert(observer.calledTwice);
  t.assert(observer.calledWith(true));

  $$one.value = false;

  t.is($joined.value, undefined);
  t.assert(observer.calledThrice);

  stop();

  $$two.value = false;

  t.is($joined.value, false);

  t.assert(observer.calledThrice); // Not called again after stop()
});

test("Readable.merge: transform with 'map'", (t) => {
  const $$one = new Writable(1);
  const $$two = new Writable(2);

  const $sum = Readable.merge([$$one, $$two], (one, two) => one + two);
  const $doubledSum = $sum.map((x) => x * 2);

  t.is($sum.value, 3);
  t.is($doubledSum.value, 6);

  $$one.value = 4;

  t.is($sum.value, 6);
  t.is($doubledSum.value, 12);
});
