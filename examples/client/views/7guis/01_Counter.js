import { makeView } from "@woofjs/client";

export default makeView((ctx) => {
  ctx.name = "7guis:Counter";

  const $$count = ctx.state(0);

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
});
