import { makeView, makeState, makeSpring } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

export const ConditionalExample = makeView({
  name: "ConditionalExample",
  setup: (ctx, h) => {
    const $$show = makeState(false);
    const $label = $$show.as((t) => (t ? "Hide Text" : "Show Text"));

    return (
      <div class="example">
        <h3>
          Conditional rendering with <code>when()</code>
        </h3>
        <div>
          <button
            style={{
              width: 100,
            }}
            onclick={() => {
              $$show.update((t) => !t);
            }}
          >
            {$label}
          </button>

          {h.when($$show, <Message />)}
        </div>
      </div>
    );
  },
});

const Message = makeView((ctx) => {
  const opacity = makeSpring(0, { stiffness: 200, damping: 50 });
  const y = makeSpring(-10, { stiffness: 200, damping: 50 });

  ctx.animateIn(() => Promise.all([opacity.to(1), y.to(0)]));
  ctx.animateOut(() => Promise.all([opacity.to(0), y.to(-10)]));

  return (
    <span
      style={{
        display: "inline-block",
        paddingLeft: "0.5rem",
        opacity: opacity,
        transform: y.as((y) => `translateY(${y}px)`),
      }}
    >
      Hello there!
    </span>
  );
});
