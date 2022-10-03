import { makeView, makeTransitions } from "@woofjs/client";
import { animate, bounceOut } from "popmotion";
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

  const $color = ctx.readable("color");
  const $enabled = ctx.readable("enabled");
  const $disabled = $enabled.to((t) => !t);
  const $isNotBestColor = $color.to((hex) => hex.toLowerCase() !== bestColor);

  function resetColor() {
    ctx.set("color", bestColor);
  }

  function randomizeColor() {
    const hex = [Math.random() * 256, Math.random() * 256, Math.random() * 256]
      .map(Math.floor)
      .map((n) => n.toString(16))
      .map((n) => (n.length < 2 ? "0" + n : n))
      .join("");
    const newColor = "#" + hex;

    animate({
      from: ctx.get("color"),
      to: newColor,
      duration: 100,
      onUpdate: (latest) => {
        ctx.set("color", latest);
      },
      onComplete: () => {
        ctx.set("color", newColor);
      },
    });
  }

  return (
    <div class="example">
      <h3>More complex state management</h3>
      <div>
        {ctx.when(
          "enabled",
          // Transitions can set window state, so this kind of composition is possible.
          animated((ctx) => {
            const $scale = ctx.readable("scale");

            return (
              <div
                class="follower"
                style={{
                  backgroundColor: $color,

                  // Composite transform based on mouse position and animated scale.
                  transform: ctx.merge(
                    $position,
                    $scale,
                    (p, s) => `translate(${p.x}px, ${p.y}px) scale(${s})`
                  ),
                }}
              />
            );
          })
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

/**
 * Scales the element up from `0` on enter and down to `0` on exit.
 * Animates the `scale` value in window's context.
 */
const animated = makeTransitions({
  in: function (ctx) {
    animate({
      from: 0,
      to: 1,
      duration: 500,
      ease: bounceOut,
      onUpdate: function (latest) {
        ctx.set({ scale: latest });
      },
      onComplete: function () {
        ctx.set({ scale: 1 });
        ctx.done();
      },
    });
  },
  out: function (ctx) {
    animate({
      from: 1,
      to: 0,
      duration: 200,
      onUpdate: function (latest) {
        ctx.set({ scale: latest });
      },
      onComplete: function () {
        ctx.set({ scale: 0 });
        ctx.done();
      },
    });
  },
});
