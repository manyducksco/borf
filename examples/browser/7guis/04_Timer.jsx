import { Writable, m } from "@borf/browser";
import { ExampleFrame } from "../views/ExampleFrame";

export default function (self) {
  self.setName("7GUIs:Timer");

  const $$duration = new Writable(10); // duration in seconds
  const $$elapsed = new Writable(0); // elapsed time in seconds

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

  self.onConnected(() => {
    lastTick = Date.now();
    tick();
  });

  self.onDisconnected(() => {
    stopped = true;
  });

  return m(ExampleFrame, { title: "4. Timer" }, [
    m.div(
      m.div(
        "Elapsed Time: ",
        m.progress({ max: $$duration, value: $$elapsed })
      ),
      m.div($$elapsed.map((seconds) => seconds.toFixed(1))),
      m.div(
        "Duration: ",
        m.input({
          type: "range",
          min: 0,
          max: 30,
          step: 0.1,
          value: $$duration,
        })
      ),
      m.div(
        m.button(
          {
            onclick: () => {
              $$elapsed.set(0);
            },
          },
          "Reset"
        )
      )
    ),
  ]);
}
