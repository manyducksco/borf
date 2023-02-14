import { makeState, View } from "woofe";
import { ExampleFrame } from "../views/ExampleFrame";

export class Timer extends View {
  static label = "7guis:Timer";

  setup(ctx) {
    const $$duration = makeState(10); // duration in seconds
    const $$elapsed = makeState(0); // elapsed time in seconds

    let lastTick = null;

    const tick = () => {
      ctx.log("tick - isConnected", ctx.isConnected);

      if (ctx.isConnected) {
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

    ctx.afterConnect(() => {
      lastTick = Date.now();

      tick();
    });

    return (
      <ExampleFrame title="4. Timer">
        <div>
          <div>
            Elapsed Time: <progress max={$$duration} value={$$elapsed} />
          </div>
          <div>{$$elapsed.as((seconds) => seconds.toFixed(1))}</div>
          <div>
            Duration:{" "}
            <input
              type="range"
              min={0}
              max={30}
              step={0.1}
              value={$$duration}
            />
          </div>
          <div>
            <button
              onclick={() => {
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
}

export default Timer;
