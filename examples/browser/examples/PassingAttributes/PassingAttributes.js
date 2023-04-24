import { m, Writable } from "@borf/browser";
import { ExampleFrame } from "../../views/ExampleFrame";

import styles from "./PassingAttributes.module.css";

/**
 * Demonstrates passing attributes to a subview.
 */
export function PassingAttributes(self) {
  const $$message = new Writable("Hello");

  return m(ExampleFrame, { title: "Input Bindings" }, [
    m.div(
      m.p(
        "Type in the box below and watch the message update. Both are bound to the same Writable."
      ),

      // Input values support two way binding, so changes here will propagate to $$message and vice versa
      m.input({ type: "text", value: $$message }),
      m.hr(),

      // Passing a writable state for two-way binding
      m(SubView, { message: $$message })
    ),
  ]);
}

/**
 * Demonstrates working with attribute bindings passed from a superview.
 */
function SubView(self) {
  const $$message = self.inputs.$$("message");

  return m.div(
    m.p("Message: ", $$message),
    m.button(
      {
        onclick: () => {
          // Writing $$message here updates the original $$message in the superview.
          $$message.set("Hello");
        },
      },
      "Reset State"
    )
  );
}
