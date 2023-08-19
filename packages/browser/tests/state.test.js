import test from "node:test";
import assert from "node:assert";
import { readable, writable, computed, unwrap } from "../lib/index.js";

test("readable, writable, computed: basic functionality", (t) => {
  const $$writable = writable("writable");
  const $readable = readable("test");
  const $x = computed($readable, (v) => v.toUpperCase());
  const $y = readable($$writable);

  const compute = t.mock.fn((x, y) => {
    return x + y;
  });

  const $computed = computed([$x, $y], compute);

  assert.strictEqual($computed.get(), "TESTwritable");

  const observer = t.mock.fn();
  const stop = $$writable.observe(observer); // Observer is called immediately with the current value.

  $$writable.set("new value"); // First observed change (second call)
  $$writable.set("new value 2"); // Second observed change (third call)

  assert.strictEqual($$writable.get(), "new value 2");
  assert.strictEqual($computed.get(), "TESTnew value 2");

  assert.strictEqual(unwrap($$writable), "new value 2");
  assert.strictEqual(unwrap("value"), "value");

  stop();

  $$writable.set("can you hear me now?"); // Sets value but is not observed.

  assert.strictEqual($$writable.get(), "can you hear me now?");
  assert.strictEqual($computed.get(), "TESTcan you hear me now?");

  assert.strictEqual(observer.mock.calls.length, 3);
  assert.deepEqual(observer.mock.calls[0].arguments, ["writable"]);
  assert.deepEqual(observer.mock.calls[1].arguments, ["new value"]);
  assert.deepEqual(observer.mock.calls[2].arguments, ["new value 2"]);
});

test("writable -> readable -> readable: chained transforms", (t) => {
  const $$number = writable(5);
  const $doubled = computed($$number, (x) => x * 2);
  const $quadrupled = computed($doubled, (x) => x * 2);
  const observer = t.mock.fn();

  assert.strictEqual($doubled.get(), 10);
  assert.strictEqual($quadrupled.get(), 20);

  const stop = $quadrupled.observe(observer);

  assert.strictEqual(observer.mock.calls.length, 1);
  assert.deepEqual(observer.mock.calls[0].arguments, [20]);

  $$number.set(50);

  assert.strictEqual(observer.mock.calls.length, 2);
  assert.deepEqual(observer.mock.calls[1].arguments, [200]);

  stop();

  $$number.set(100);

  assert.strictEqual($quadrupled.get(), 400);

  // Not called again after stop().
  assert.strictEqual(observer.mock.calls.length, 2);
});

test("writable: update", (t) => {
  const $$numbers = writable(["one", "two", "three"]);

  const original = $$numbers.get();

  $$numbers.update((list) => [...list, "four"]);

  const updated = $$numbers.get();

  assert.notDeepEqual(original, updated);
  assert.strictEqual(updated.length, 4);
});

test("readable, writable, computed: observer called with initial value when registered", (t) => {
  const $$value = writable(1);
  const $value = readable(5);
  const $doubled = computed($value, (x) => x * 2);
  const $multi = computed([$value, $doubled], (x, y) => x + y);

  // Writable
  const wObserver = t.mock.fn();
  const wStop = $$value.observe(wObserver);
  assert.strictEqual(wObserver.mock.calls.length, 1);
  assert.deepEqual(wObserver.mock.calls[0].arguments, [1]);
  wStop();

  // Readable
  const rObserver = t.mock.fn();
  const rStop = $value.observe(rObserver);
  assert.strictEqual(rObserver.mock.calls.length, 1);
  assert.deepEqual(rObserver.mock.calls[0].arguments, [5]);
  rStop();

  // Computed (single source)
  const cObserver1 = t.mock.fn();
  const cStop1 = $doubled.observe(cObserver1);
  assert.strictEqual(cObserver1.mock.calls.length, 1);
  assert.deepEqual(cObserver1.mock.calls[0].arguments, [10]);
  cStop1();

  // Computed (single source)
  const cObserver2 = t.mock.fn();
  const cStop2 = $multi.observe(cObserver2);
  assert.strictEqual(cObserver2.mock.calls.length, 1);
  assert.deepEqual(cObserver2.mock.calls[0].arguments, [15]);
  cStop2();
});

test("computed: basic functionality", (t) => {
  const $$one = writable(2);
  const $$two = writable(4);
  const $$three = writable(8);

  const joinFirst = t.mock.fn((one, two) => {
    return one + two;
  });
  const $first = computed([$$one, $$two], joinFirst);

  const joinSecond = t.mock.fn((one, two, three) => {
    return one + two + three;
  });
  const $second = computed([$$one, $$two, $$three], joinSecond);

  assert.strictEqual($first.get(), 6);
  assert.strictEqual($second.get(), 14);

  assert.strictEqual(joinFirst.mock.callCount(), 1);
  assert.strictEqual(joinSecond.mock.callCount(), 1);

  const observer = t.mock.fn();
  const stop = $second.observe(observer);

  assert.strictEqual(observer.mock.callCount(), 1);
  assert.deepEqual(observer.mock.calls[0].arguments, [14]); // Observer receives initial value.
  assert.strictEqual(joinSecond.mock.callCount(), 2);

  $$two.set(16);

  assert.strictEqual(joinFirst.mock.callCount(), 1);
  assert.strictEqual(joinSecond.mock.callCount(), 3);

  assert.strictEqual($first.get(), 18);
  assert.strictEqual($second.get(), 26);

  assert.strictEqual(joinFirst.mock.callCount(), 2);
  assert.strictEqual(joinSecond.mock.callCount(), 3);

  assert.strictEqual(observer.mock.callCount(), 2); // Observer received value.
  assert.deepEqual(observer.mock.calls[1].arguments, [26]);

  stop();

  $$one.set(32);

  assert.strictEqual($first.get(), 48);
  assert.strictEqual($second.get(), 56);

  assert.strictEqual(joinFirst.mock.callCount(), 3);
  assert.strictEqual(joinSecond.mock.callCount(), 4);

  assert.strictEqual(observer.mock.callCount(), 2); // Not called after stop()
});

test("computed: observers received value when undefined", (t) => {
  const $$one = writable(true);
  const $$two = writable(false);

  const $joined = computed([$$one, $$two], (one, two) => {
    if (one && two) {
      return true;
    }
    if (!one && !two) {
      return false;
    }
  });

  assert.strictEqual($joined.get(), undefined);

  const observer = t.mock.fn();
  const stop = $joined.observe(observer);

  assert.strictEqual(observer.mock.calls.length, 1);
  assert.deepEqual(observer.mock.calls[0].arguments, [undefined]);

  $$two.set(true);

  assert.strictEqual($joined.get(), true);
  assert.strictEqual(observer.mock.calls.length, 2);
  assert.deepEqual(observer.mock.calls[1].arguments, [true]);

  $$one.set(false);

  assert.strictEqual($joined.get(), undefined);
  assert.strictEqual(observer.mock.calls.length, 3);
  assert.deepEqual(observer.mock.calls[2].arguments, [undefined]);

  stop();

  $$two.set(false);

  assert.strictEqual($joined.get(), false);

  assert.strictEqual(observer.mock.calls.length, 3); // Not called again after stop()
});

test("computed: observer only gets new values when they are different", (t) => {
  const $$source = writable({ name: "Jimbo Jones", age: 346 });
  const $age = computed($$source, (x) => x.age);

  const ageObserver = t.mock.fn();
  const stop = $age.observe(ageObserver);

  assert.strictEqual(ageObserver.mock.calls.length, 1);
  assert.deepEqual(ageObserver.mock.calls[0].arguments, [346]);

  $$source.update((current) => {
    return { ...current, name: "Not Jimbo Jones" };
  });

  assert.strictEqual(ageObserver.mock.calls.length, 1); // Age has not changed, so shouldn't be observed again.

  $$source.update((current) => {
    return { ...current, age: 347 };
  });

  assert.strictEqual(ageObserver.mock.calls.length, 2); // Age change should have been observed.
  assert.deepEqual(ageObserver.mock.calls[1].arguments, [347]);

  stop();
});