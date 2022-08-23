import { when, makeState, makeComponent } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

export const ConditionalExample = makeComponent((ctx) => {
  ctx.debug.name = "ConditionalExample";

  logLifecycle(ctx);

  const $show = makeState(false);
  const $label = $show.map((on) => (on ? "Hide Text" : "Show Text"));

  return (
    <div class="example">
      <h3>
        Conditional rendering with <code>when()</code>
      </h3>
      <div>
        <button
          onclick={() => {
            $show.set((current) => !current);
          }}
        >
          {$label}
        </button>
        {when($show, <span>Hello there!</span>)}
      </div>
    </div>
  );
});
