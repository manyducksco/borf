import { View, makeState, joinStates, makeSpring } from "woofe";
import { animate } from "popmotion";
import logLifecycle from "../utils/logLifecycle.js";
import { MouseStore } from "../globals/MouseStore.js";

const bestColor = "#ff0088";

export class MouseFollowerExample extends View {
  setup(ctx, { when }) {
    const $$enabled = makeState(false);
    const $$color = makeState(bestColor);

    logLifecycle(ctx);

    const mouse = ctx.useStore(MouseStore);

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
          {when(
            $$enabled,
            <MouseFollower position={mouse.$position} color={$$color} />
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

          <button onclick={() => $$enabled.update((t) => !t)}>
            {$$enabled.as((t) =>
              t ? "Turn Off Follower" : "Turn On Follower"
            )}
          </button>
        </div>
      </div>
    );
  }
}

class MouseFollower extends View {
  static inputs = {
    color: {
      type: "string",
      required: true,
    },
    position: {
      type: "object",
      required: true,
    },
  };

  setup(ctx) {
    const scale = makeSpring(0, {
      stiffness: 200,
      damping: 30,
    });

    ctx.animateIn(() => scale.to(1));
    ctx.animateOut(() => scale.to(0));

    const $color = ctx.inputs.readable("color");
    const $position = ctx.inputs.readable("position");

    return (
      <div
        class="follower"
        style={{
          backgroundColor: $color,

          // Composite transform based on mouse position and animated scale.
          transform: joinStates(
            $position,
            scale,
            (p, s) => `translate(${p.x}px, ${p.y}px) scale(${s})`
          ),
        }}
      />
    );
  }
}
