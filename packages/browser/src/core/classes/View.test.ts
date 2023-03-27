import { View } from "./View.js";

describe("define", () => {
  test("returns a view", () => {
    const Test = View.define({
      setup: (ctx, m) => m("span", "hello"),
    });

    expect(View.isView(Test));
  });
});
