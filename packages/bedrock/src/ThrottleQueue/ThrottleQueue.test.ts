import test from "ava";
import { sleep } from "../helpers/sleep.js";
import { Type } from "../Type/Type.js";
import { ThrottleQueue } from "./ThrottleQueue.js";

test("ThrottleQueue", (t) => {
  return new Promise((resolve) => {
    t.plan(43); // 10 in-queue, 10 on resolve, 1 on complete.
    t.timeout(2000);

    let running = 0;
    let started = 0;
    let finished = 0;

    const queue = new ThrottleQueue(3, async (item: number) => {
      t.assert(running <= 3); // Never over 3 pending at one time.

      started++;
      running++;
      await sleep(Math.round(Math.random() * 50));
      running--;
      finished++;

      return item * 2; // returns doubled value.
    });

    // queue.debug = true;

    queue.on("resolve", function onResolve(n, result) {
      t.assert(Type.isNumber(n));
      t.assert(Type.isNumber(result));
      t.is(result, n * 2);
    });

    queue.on("reject", function onReject(n, error) {
      t.fail(); // Nothing should reject.
    });

    queue.on("complete", function onComplete() {
      t.is(running, 0);
      t.is(started, 10);
      t.is(finished, 10);

      resolve();
    });

    // BatchQueue is infinite and will continue to process new items when added (while !stopped).
    queue.add(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

    queue.start();
  });
});
