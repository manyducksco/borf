import { makeState, View } from "woofe";

class Counter extends View {
  static label = "7guis:Counter";

  setup(ctx) {
    const $$count = makeState(0);

    return (
      <div class="example">
        <header>
          <h3>Counter</h3>
        </header>

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
      </div>
    );
  }
}

export default Counter;
