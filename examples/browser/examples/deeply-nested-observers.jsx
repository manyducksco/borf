import { writable, readable, cond, computed } from "@borf/browser";
import { ExampleFrame } from "../views/ExampleFrame";

export default function DeeplyNestedObservers(_, c) {
  const $$showMessage = writable(true);
  const $$count = writable(1);
  const $label = computed([$$count], (value) => {
    if (value % 15 === 0) {
      return "fizzbuzz";
    } else if (value % 3 === 0) {
      return "fizz";
    } else if (value % 5 === 0) {
      return "buzz";
    } else {
      return String(value);
    }
  });

  // TODO: Rendering this inside of the showMessage cond will not display a value until it changes again after the span is re-enabled.
  // It seems to be specifically with the array-of-readables path of computed.
  const $uppercased = computed([$label], (label) => label.toUpperCase());

  let interval;

  c.onConnected(() => {
    interval = setInterval(() => {
      $$count.update((n) => n + 1);
    }, 5000);
  });

  c.onDisconnected(() => {
    clearInterval(interval);
  });

  // This example tests that observers work correctly inside of conditionals, repeat and other utilities.
  return (
    <ExampleFrame title="Deeply Nested Observers">
      {cond(
        $$showMessage,
        <div>
          <span>{$label}</span>
        </div>
      )}
      <hr />
      <button
        onClick={() => {
          $$showMessage.update((x) => !x);
        }}
      >
        {cond($$showMessage, "Hide Message", "Show Message")}
      </button>
    </ExampleFrame>
  );
}
