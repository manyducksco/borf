import { when } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

const bestColor = "#ff0088";

export function MouseFollowerExample() {
  this.name = "MouseFollowerExample";
  this.defaultState = {
    enabled: false,
    color: bestColor,
  };

  logLifecycle(this);

  const { $position } = this.global("mouse");
  const $transform = $position.to((pos) => `translate(${pos.x}px, ${pos.y}px)`);

  const $enabled = this.read("enabled");
  const $color = this.read("color");
  const $disabled = $enabled.to((t) => !t);
  const $isNotBestColor = $color.to((hex) => hex.toLowerCase() !== bestColor);

  const resetColor = () => {
    this.set("color", bestColor);
  };

  const randomizeColor = () => {
    const hex = [Math.random() * 256, Math.random() * 256, Math.random() * 256]
      .map(Math.floor)
      .map((n) => n.toString(16))
      .join("");

    this.set("color", "#" + hex);
  };

  return (
    <div class="example">
      <h3>More complex state management</h3>
      <div>
        {when(
          $enabled,
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

        {when(
          $isNotBestColor,
          <button onclick={resetColor} disabled={$disabled}>
            Reset to Best Color
          </button>
        )}

        <button onclick={() => this.set("enabled", (t) => !t)}>
          {$enabled.to((t) => (t ? "Turn Off Follower" : "Turn On Follower"))}
        </button>
      </div>
    </div>
  );
}
