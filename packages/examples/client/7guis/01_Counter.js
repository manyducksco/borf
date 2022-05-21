import { makeComponent, makeState } from "@woofjs/client";

export default makeComponent(($, self) => {
  const $count = makeState(0);

  return (
    <div class="example">
      <header>
        <h3>Counter</h3>
      </header>

      <div>
        <input type="text" disabled value={$.bind($count)} />
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
});
