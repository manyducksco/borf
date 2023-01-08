import {
  h,
  makeTransitions,
  makeView,
  makeState,
  withName,
} from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

export const ConditionalExample = makeView(
  withName("ConditionalExample"),
  (ctx) => {
    logLifecycle(ctx);

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

          {h.when(
            $$show,
            <Animated>
              <span style={{ display: "inline-block", paddingLeft: "0.5rem" }}>
                Hello there!
              </span>
            </Animated>
          )}
        </div>
      </div>
    );
  }
);

const Animated = makeTransitions((ctx) => {
  const opacity = makeSpring(0);
  const y = makeSpring(-10);

  ctx.enter(() => {
    return Promise.all([opacity.to(1), y.to(0)]);
  });

  ctx.exit(() => {
    return Promise.all([opacity.to(0), y.to(-10)]);
  });

  // Update DOM node directly.
  ctx.observe(opacity, (current) => {
    ctx.node.style.opacity = current;
  });
  ctx.observe(y, (current) => {
    ctx.node.style.transform = `translateY(${current}px)`;
  });
});
