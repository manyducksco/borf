import { makeComponent, makeState } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

const MouseFollowerExample = makeComponent(($, self) => {
  self.debug.name = "MouseFollowerExample";

  logLifecycle(self);

  const { $position } = self.getService("mouse");
  const bestColor = "#ff0088";

  const $isEnabled = makeState(false);
  const $backgroundColor = makeState(bestColor);
  const $transform = $position.map((pos) => `translate(${pos.x}px, ${pos.y}px)`);
  const $isNotBestColor = $backgroundColor.map((hex) => hex.toLowerCase() !== bestColor);

  const resetColor = () => {
    $backgroundColor.set(bestColor);
  };

  const randomizeColor = () => {
    const hex = [Math.random() * 256, Math.random() * 256, Math.random() * 256]
      .map(Math.floor)
      .map((n) => n.toString(16))
      .join("");

    $backgroundColor.set("#" + hex);
  };

  return (
    <div class="example">
      <h3>More complex state management</h3>
      <div>
        {$.if(
          $isEnabled,
          <div
            class="follower"
            style={{
              transform: $transform,
              backgroundColor: $backgroundColor,
            }}
          />
        )}

        <button onclick={randomizeColor} disabled={$isEnabled.map((yes) => !yes)}>
          Change Follower Color
        </button>

        {$.if(
          $isNotBestColor,
          <button onclick={resetColor} disabled={$isEnabled.map((yes) => !yes)}>
            Reset to Best Color
          </button>
        )}

        <button onclick={() => $isEnabled.set((yes) => !yes)}>
          {$.text($isEnabled.map((yes) => (yes ? "Turn Off Follower" : "Turn On Follower")))}
        </button>
      </div>
    </div>
  );
});

export default MouseFollowerExample;
