// import woof, { state } from "../dist/woof";

import * as all from "../dist/woof.js";

test("works", () => {
  console.log(all);

  expect(true).toBe(false);
});

// test("exports expected things", () => {
//   expect(typeof woof).toBe("function");
//   expect(typeof state).toBe("function");
// });

// test("default function creates a working Woof instance", () => {
//   const app = woof();

//   console.log(app);
// });
