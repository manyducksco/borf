import test from "ava";
import { sleep } from "../helpers/sleep.js";
import { isNumber } from "../typeChecking.js";
import { BatchQueue } from "./BatchQueue.js";

test("BatchQueue", (t) => {
  return new Promise((resolve) => {
    t.plan(43); // 10 in-queue, 10 on resolve, 1 on complete.
    t.timeout(2000);

    let running = 0;
    let started = 0;
    let finished = 0;

    const queue = new BatchQueue(3, async (item: number) => {
      t.assert(running <= 3); // Never over 5 pending at one time.

      started++;
      running++;
      await sleep(Math.round(Math.random() * 150));
      running--;
      finished++;

      return item * 2; // returns doubled value.
    });

    // queue.debug = true;

    queue.on("resolve", function onResolve(n, result) {
      t.assert(isNumber(n));
      t.assert(isNumber(result));
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
