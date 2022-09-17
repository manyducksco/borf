import { makeView } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

const bestColor = "#ff0088";

export const MouseFollowerExample = makeView((ctx) => {
  ctx.name = "MouseFollowerExample";
  ctx.defaultState = {
    enabled: false,
    color: bestColor,
  };

  logLifecycle(ctx);

  const { $position } = ctx.global("mouse");
  const $transform = $position.to((p) => `translate(${p.x}px, ${p.y}px)`);

  const $enabled = ctx.readable("enabled");
  const $color = ctx.readable("color");
  const $disabled = $enabled.to((t) => !t);
  const $isNotBestColor = $color.to((hex) => hex.toLowerCase() !== bestColor);

  function resetColor() {
    ctx.set("color", bestColor);
  }

  function randomizeColor() {
    const hex = [Math.random() * 256, Math.random() * 256, Math.random() * 256]
      .map(Math.floor)
      .map((n) => n.toString(16))
      .join("");

    ctx.set("color", "#" + hex);
  }

  return (
    <div class="example">
      <h3>More complex state management</h3>
      <div>
        {ctx.when(
          "enabled",
          <div
            class="follower"
            style={{
              transform: $transform,
              backgroundColor: $color,
            }}
          />
        )}

        <button onclick={randomizeColor} disabled={$disabled}>
          Change Follower Color
        </button>

        {ctx.when(
          $isNotBestColor,
          <button onclick={resetColor} disabled={$disabled}>
            Reset to Best Color
          </button>
        )}

        <button onclick={() => ctx.set("enabled", (t) => !t)}>
          {$enabled.to((t) => (t ? "Turn Off Follower" : "Turn On Follower"))}
        </button>
      </div>
    </div>
  );
});
