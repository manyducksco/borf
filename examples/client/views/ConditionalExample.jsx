import { makeView } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

export const ConditionalExample = makeView((ctx) => {
  ctx.name = "ConditionalExample";
  ctx.defaultState = {
    show: false,
  };

  logLifecycle(ctx);

  const $label = ctx
    .readable("show")
    .to((t) => (t ? "Hide Text" : "Show Text"));

  return (
    <div class="example">
      <h3>
        Conditional rendering with <code>when()</code>
      </h3>
      <div>
        <button
          onclick={() => {
            ctx.set("show", (t) => !t);
          }}
        >
          {$label}
        </button>
        {ctx.when("show", <span>Hello there!</span>)}
      </div>
    </div>
  );
});
