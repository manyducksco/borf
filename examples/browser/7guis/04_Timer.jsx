import { writable, computed } from "@borf/browser";
import { ExampleFrame } from "../views/ExampleFrame";

export default function (_, ctx) {
  ctx.name = "7GUIs:Timer";

  const $$duration = writable(10); // duration in seconds
  const $$elapsed = writable(0); // elapsed time in seconds

  let lastTick = null;
  let stopped = false;

  const tick = () => {
    if (!stopped) {
      const now = Date.now();

      const elapsed = $$elapsed.get();
      const duration = $$duration.get();

      // Only update if $elapsed hasn't yet reached $duration
      if (elapsed < duration) {
        const difference = (now - lastTick) / 1000;

        $$elapsed.update((current) => {
          return Math.min(current + difference, duration);
        });
      }

      lastTick = now;
      window.requestAnimationFrame(tick);
    }
  };

  ctx.onConnected(() => {
    lastTick = Date.now();
    tick();
  });

  ctx.onDisconnected(() => {
    stopped = true;
  });

  return (
    <ExampleFrame title="4. Timer">
      <div>
        <div>
          Elapsed Time: <progress max={$$duration} value={$$elapsed} />
        </div>
        <div>{computed($$elapsed, (seconds) => seconds.toFixed(1))}</div>
        <div>
          Duration:{" "}
          <input
            type="range"
            min={0}
            max={30}
            step={0.1}
            $$value={$$duration}
          />
        </div>
        <div>
          <button
            onClick={() => {
              $$elapsed.set(0);
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </ExampleFrame>
  );
}
