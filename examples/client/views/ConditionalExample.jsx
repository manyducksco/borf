import { makeView, makeTransitions } from "@woofjs/client";
import { animate } from "popmotion";
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
          style={{
            width: 100,
          }}
          onclick={() => {
            ctx.set("show", (t) => !t);
          }}
        >
          {$label}
        </button>
        {ctx.when(
          "show",
          animated(
            <span style={{ display: "inline-block", paddingLeft: "0.5rem" }}>
              Hello there!
            </span>
          )
        )}
      </div>
    </div>
  );
});

const animated = makeTransitions({
  in: function (ctx) {
    animate({
      from: { opacity: 0, y: -10 },
      to: { opacity: 1, y: 0 },
      duration: 200,
      onUpdate: function (latest) {
        ctx.node.style.opacity = latest.opacity;
        ctx.node.style.transform = `translateY(${latest.y}px)`;
      },
      onComplete: function () {
        ctx.done();
      },
    });
  },
  out: function (ctx) {
    animate({
      from: { opacity: 1, y: 0 },
      to: { opacity: 0, y: 10 },
      duration: 200,
      onUpdate: function (latest) {
        ctx.node.style.opacity = latest.opacity;
        ctx.node.style.transform = `translateY(${latest.y}px)`;
      },
      onComplete: function () {
        ctx.done();
      },
    });
  },
});
