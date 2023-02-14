import { makeState, View } from "woofe";
import { ExampleFrame } from "../views/ExampleFrame";

class Counter extends View {
  static label = "7guis:Counter";

  setup(ctx) {
    const $$count = makeState(0);

    return (
      <ExampleFrame title="1. Counter">
        <div>
          <input type="text" value={$$count.readable()} disabled />
          <button
            onclick={() => {
              $$count.update((n) => n + 1);
            }}
          >
            Increment
          </button>
        </div>
      </ExampleFrame>
    );
  }
}

export default Counter;
