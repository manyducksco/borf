import test from "ava";
import { Observable } from "./Observable.js";

test("basics", (t) => {
  const numbers = Observable.of(1, 2, 3);
  const doubled = numbers.map((n) => n * 2);

  const received: number[] = [];

  const sub1 = numbers.subscribe((value) => {
    received.push(value);
  });

  const sub2 = doubled.subscribe((value) => {
    received.push(value);
  });

  sub1.unsubscribe();
  sub2.unsubscribe();

  t.deepEqual(received, [1, 2, 3, 2, 4, 6]);
});
