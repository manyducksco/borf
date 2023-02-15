import { View, State } from "woofe";
import { ExampleFrame } from "../../views/ExampleFrame";
import logLifecycle from "../../utils/logLifecycle.js";

import styles from "./PassingAttributes.module.css";

export class PassingAttributes extends View {
  static about = "Demonstrates passing attributes to a subview.";

  setup(ctx, m) {
    logLifecycle(ctx);

    const $$message = new State("Hello");

    return (
      <ExampleFrame>
        <h3>Passing Attributes</h3>
        <div>
          {/* Input values support two way binding, so changes here will propagate to $$message and vice versa */}
          <input type="text" value={$$message} />
          <hr />
          {/* Passing a writable state for two-way binding */}
          <SubView message={$$message} />
        </div>
      </ExampleFrame>
    );
  }
}

class SubView extends View {
  static about =
    "Demonstrates working with attribute bindings passed from a superview.";

  static inputs = {
    message: {
      type: "string",
      required: true, // Throws an error if this input isn't passed.
      writable: true, // Allows this view to write back to a writable binding.
      // Without 'writable: true', writable bindings will be read-only when passed.
    },
  };

  setup(ctx) {
    logLifecycle(ctx);

    const $$message = ctx.inputs.writable("message");

    return (
      <div>
        <p>Message: {$$message}</p>
        <button
          onclick={() => {
            // Writing $$message here updates the original $$message in the superview.
            $$message.set("Hello");
          }}
        >
          Reset State
        </button>
      </div>
    );
  }
}
