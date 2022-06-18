import { h } from "../h.js";
import { makeState } from "@woofjs/state";
import { wrapComponent } from "./wrapComponent.js";
import { initComponent } from "../helpers/initComponent.js";

test("f", () => {
  function Component($attrs, self) {
    const { $message } = self.getService("test");

    return h("div", $message, ": ", $attrs.map("text"));
  }

  const Wrapped = wrapComponent(Component, (self) => {
    self.service("test", {
      $message: makeState("this is the text"),
    });
  });

  console.log(Wrapped());
});
