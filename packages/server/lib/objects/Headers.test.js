import { Headers } from "./Headers.js";

test("constructor", () => {
  const arrayHeaders = new Headers([
    ["Content-Type", "application/json"],
    ["Accept", "text/html"],
  ]);

  const objectHeaders = new Headers({
    "Content-Type": "application/json",
    Accept: "text/html",
  });

  expect(arrayHeaders.toJSON()).toStrictEqual({
    "content-type": "application/json",
    accept: "text/html",
  });

  expect(objectHeaders.toJSON()).toStrictEqual({
    "content-type": "application/json",
    accept: "text/html",
  });
});

// test("append", () => {
//   const headers = new Headers();
// });
