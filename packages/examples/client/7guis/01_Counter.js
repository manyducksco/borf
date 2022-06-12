import { v, makeState } from "@woofjs/client";

export default function Counter() {
  this.debug.name = "7GUIs:Counter";

  const $count = makeState(0);

  return (
    <div class="example">
      <header>
        <h3>Counter</h3>
      </header>

      <div>
        <input type="text" value={$count} disabled />
        <button
          onclick={() => {
            $count.set((n) => n + 1);
          }}
        >
          Increment
        </button>
      </div>
    </div>
  );
}
