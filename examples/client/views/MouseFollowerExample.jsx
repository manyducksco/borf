import {
  h,
  makeView,
  makeTransitions,
  withTransitions,
  withAttributes,
  makeState,
  joinStates,
  withName,
  makeSpring,
} from "@woofjs/client";
import { animate } from "popmotion";
import logLifecycle from "../utils/logLifecycle.js";

const bestColor = "#ff0088";

export const MouseFollowerExample = makeView(
  withName("MouseFollowerExample"),
  (ctx) => {
    const $$enabled = makeState(false);
    const $$color = makeState(bestColor);

    logLifecycle(ctx);

    const mouse = ctx.global("mouse");

    const $disabled = $$enabled.as((t) => !t);
    const $isNotBestColor = $$color.as(
      (hex) => hex.toLowerCase() !== bestColor
    );

    function resetColor() {
      $$color.set(bestColor);
    }

    function randomizeColor() {
      const hex = [
        Math.random() * 256,
        Math.random() * 256,
        Math.random() * 256,
      ]
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
          {h.when(
            $$enabled,
            <MouseFollower position={mouse.$position} color={$$color} />
          )}

          <button onclick={randomizeColor} disabled={$disabled}>
            Change Follower Color
          </button>

          {h.when(
            $isNotBestColor,
            <button onclick={resetColor} disabled={$disabled}>
              Reset to Best Color
            </button>
          )}

          <button onclick={() => $$enabled.update((t) => !t)}>
            {$$enabled.as((t) =>
              t ? "Turn Off Follower" : "Turn On Follower"
            )}
          </button>
        </div>
      </div>
    );
  }
);

/**
 * Scales the element up from `0` on enter and down to `0` on exit.
 * Animates the `scale` value in view's context.
 */
const scaleInOut = makeTransitions((ctx) => {
  const scale = makeSpring(0, {
    stiffness: 200,
    damping: 30,
  });

  ctx.enter(async () => {
    return scale.to(1);
  });

  ctx.exit(async () => {
    return scale.to(0);
  });

  return { scale };
});

const MouseFollower = makeView(
  withName("AnimatedMouseFollower"),
  withTransitions(scaleInOut),
  withAttributes({
    color: {
      type: "string",
      required: true,
    },
    position: {
      type: "object",
      required: true,
    },
    scale: {
      type: "number",
      required: true,
    },
  }),
  (ctx) => {
    const $color = ctx.attrs.readable("color");
    const $position = ctx.attrs.readable("position");
    const $scale = ctx.attrs.readable("scale");

    return (
      <div
        class="follower"
        style={{
          backgroundColor: $color,

          // Composite transform based on mouse position and animated scale.
          transform: joinStates(
            $position,
            $scale,
            (p, s) => `translate(${p.x}px, ${p.y}px) scale(${s})`
          ),
        }}
      />
    );
  }
);
