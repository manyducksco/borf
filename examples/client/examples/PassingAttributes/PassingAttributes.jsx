import { View, makeState } from "woofe";
import { ExampleFrame } from "../../views/ExampleFrame";

import styles from "./PassingAttributes.module.css";

export class PassingAttributes extends View {
  static about = "Demonstrates passing attributes to a subview.";

  setup(ctx, m) {
    const $$message = makeState("Hello");

    return (
      <ExampleFrame>
        <div class={styles.example}>
          <h3>Passing Attributes</h3>
          <div>
            {/* Input values support two way binding, so changes here will propagate to $$message and vice versa */}
            <input type="text" value={$$message} />
            <hr />
            {/* Passing a writable state for two-way binding */}
            <SubView message={$$message} />
          </div>
        </div>
      </ExampleFrame>
    );
  }
}

// Pass as writable?
// <SomeView $$message={$$message} />

// Pass as readable?
// <SomeView $message={$$message} />

// Pass as static?
// <SomeView message={$$message} />

class SubView extends View {
  static about =
    "Demonstrates working with attribute bindings passed from a superview.";

  static attrs = {
    message: {
      type: "string",
      required: true, // Throws an error if this attribute isn't passed.
      writable: true, // Allows this view to write back to a writable binding.
      // Without 'writable: true', writable bindings will be read-only when passed.
    },
  };

  setup(ctx) {
    const $$message = ctx.attrs.writable("message");

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
