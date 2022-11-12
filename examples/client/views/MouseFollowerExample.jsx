import { makeView, makeTransitions } from "@woofjs/client";
import { animate, bounceOut } from "popmotion";
import logLifecycle from "../utils/logLifecycle.js";

const bestColor = "#ff0088";

export const MouseFollowerExample = makeView((ctx) => {
  ctx.name = "MouseFollowerExample";

  const $$enabled = ctx.state(false);
  const $$color = ctx.state(bestColor);

  logLifecycle(ctx);

  const { $position } = ctx.global("mouse");

  const $disabled = $$enabled.as((t) => !t);
  const $isNotBestColor = $$color.as((hex) => hex.toLowerCase() !== bestColor);

  function resetColor() {
    $$color.set(bestColor);
  }

  function randomizeColor() {
    const hex = [Math.random() * 256, Math.random() * 256, Math.random() * 256]
      .map(Math.floor)
      .map((n) => n.toString(16))
      .map((n) => (n.length < 2 ? "0" + n : n))
      .join("");
    const newColor = "#" + hex;

    animate({
      from: $$color.get(),
      to: newColor,
      duration: 100,
      onUpdate: (latest) => {
        $$color.set(latest);
      },
      onComplete: () => {
        $$color.set(newColor);
      },
    });
  }

  return (
    <div class="example">
      <h3>More complex state management</h3>
      <div>
        {ctx.when(
          $$enabled,
          // Transitions can set view state, so this kind of composition is possible.
          animated((ctx) => {
            ctx.name = "AnimatedMouseFollower";

            const { $transition } = ctx.attrs;
            const $scale = $transition.as((t) => t.scale || 0);

            return (
              <div
                class="follower"
                style={{
                  backgroundColor: $$color,

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

        <button onclick={() => $$enabled.update((t) => !t)}>
          {$$enabled.as((t) => (t ? "Turn Off Follower" : "Turn On Follower"))}
        </button>
      </div>
    </div>
  );
});

/**
 * Scales the element up from `0` on enter and down to `0` on exit.
 * Animates the `scale` value in view's context.
 */
const animated = makeTransitions({
  enter(ctx) {
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
  exit(ctx) {
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
