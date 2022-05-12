import { makeSuite, wrapComponent } from "@woofjs/client/testing";
import ToggleExample from "./ToggleExample.js";

export default makeSuite((test, view) => {
  const makeToggleExample = wrapComponent(ToggleExample);

  view("example", () => {
    return makeToggleExample();
  });

  test("passes", (t) => {
    t.same(1, 1);
    t.equal({ message: "hello" }, { message: "hello" });
  });
});
