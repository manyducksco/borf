import { bind, makeState } from "@woofjs/client";

export default function Timer(self) {
  self.debug.name = "7GUIs:Timer";

  const $duration = makeState(10); // duration in seconds
  const $elapsed = makeState(0); // elapsed time in seconds

  let lastTick = null;

  function tick() {
    if (self.isConnected) {
      const now = Date.now();

      // Only update if $elapsed hasn't yet reached $duration
      if ($elapsed.get() < $duration.get()) {
        const difference = (now - lastTick) / 1000;

        $elapsed.set((current) =>
          Math.min(current + difference, $duration.get())
        );
      }

      lastTick = now;
      window.requestAnimationFrame(tick);
    }
  }

  self.afterConnect(() => {
    lastTick = Date.now();

    tick();
  });

  return (
    <div class="example">
      <header>
        <h3>Timer</h3>
      </header>

      <div>
        <div>
          Elapsed Time: <progress max={$duration} value={$elapsed} />
        </div>
        <div>{$elapsed.map((seconds) => seconds.toFixed(1))}</div>
        <div>
          Duration:{" "}
          <input
            type="range"
            min={0}
            max={30}
            step={0.1}
            value={bind($duration)}
          />
        </div>
        <div>
          <button
            onclick={() => {
              $elapsed.set(0);
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
