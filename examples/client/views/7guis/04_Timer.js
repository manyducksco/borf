import { makeView } from "@woofjs/client";

export default makeView((ctx) => {
  ctx.name = "7guis:Timer";
  ctx.defaultState = {
    duration: 10, // duration in seconds
    elapsed: 0, // elapsed time in seconds
  };

  let lastTick = null;

  const tick = () => {
    if (ctx.isConnected) {
      const now = Date.now();

      const elapsed = ctx.get("elapsed");
      const duration = ctx.get("duration");

      // Only update if $elapsed hasn't yet reached $duration
      if (elapsed < duration) {
        const difference = (now - lastTick) / 1000;

        ctx.set("elapsed", (current) => {
          return Math.min(current + difference, duration);
        });
      }

      lastTick = now;
      window.requestAnimationFrame(tick);
    }
  };

  ctx.afterConnect(() => {
    lastTick = Date.now();

    tick();
  });

  const $duration = ctx.readable("duration");
  const $elapsed = ctx.readable("elapsed");

  return (
    <div class="example">
      <header>
        <h3>Timer</h3>
      </header>

      <div>
        <div>
          Elapsed Time: <progress max={$duration} value={$elapsed} />
        </div>
        <div>{$elapsed.to((seconds) => seconds.toFixed(1))}</div>
        <div>
          Duration:{" "}
          <input
            type="range"
            min={0}
            max={30}
            step={0.1}
            value={ctx.writable("duration")}
          />
        </div>
        <div>
          <button
            onclick={() => {
              ctx.set("elapsed", 0);
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
});
