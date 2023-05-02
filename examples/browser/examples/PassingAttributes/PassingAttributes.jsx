import { Writable } from "@borf/browser";
import { ExampleFrame } from "../../views/ExampleFrame";

import styles from "./PassingAttributes.module.css";

/**
 * Demonstrates passing attributes to a subview.
 */
export function PassingAttributes() {
  const $$message = new Writable("Hello");

  return (
    <ExampleFrame title="Input Bindings">
      <div>
        <p>
          Type in the box below and watch the message update. Both are bound to
          the same Writable.
        </p>

        <input type="text" value={$$message} />
        <hr />

        <SubView $$message={$$message} />
      </div>
    </ExampleFrame>
  );
}

/**
 * Demonstrates working with attribute bindings passed from a superview.
 */
function SubView({ $$message }) {
  return (
    <div>
      <p>Message: {$$message}</p>
      <button
        onclick={() => {
          // Writing $$message here updates the original $$message in the superview.
          $$message.value = "Hello";
        }}
      >
        Reset State
      </button>
    </div>
  );
}