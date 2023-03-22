import test from "ava";
import { Headers } from "./Headers.js";

test("constructor", (t) => {
  const arrayHeaders = new Headers([
    ["Content-Type", "application/json"],
    ["Accept", "text/html"],
  ]);

  const objectHeaders = new Headers({
    "Content-Type": "application/json",
    Accept: "text/html",
  });

  t.deepEqual(arrayHeaders.toJSON(), {
    "content-type": "application/json",
    accept: "text/html",
  });

  t.deepEqual(objectHeaders.toJSON(), {
    "content-type": "application/json",
    accept: "text/html",
  });
});

// test("append", (t) => {
//   const headers = new Headers();
// });
