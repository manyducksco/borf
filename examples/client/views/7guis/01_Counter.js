import { makeView } from "@woofjs/client";

export default makeView((ctx) => {
  ctx.name = "7guis:Counter";
  ctx.defaultState = {
    count: 0,
  };

  const $count = ctx.readable("count");

  return (
    <div class="example">
      <header>
        <h3>Counter</h3>
      </header>

      <div>
        <input type="text" value={$count} disabled />
        <button
          onclick={() => {
            ctx.set("count", (n) => n + 1);
          }}
        >
          Increment
        </button>
      </div>
    </div>
  );
});
