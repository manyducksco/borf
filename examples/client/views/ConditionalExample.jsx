import { makeTransitions, makeView, makeState } from "@woofjs/client";
import { animate } from "popmotion";
import logLifecycle from "../utils/logLifecycle.js";

export const ConditionalExample = makeView((ctx, h) => {
  ctx.name = "ConditionalExample";

  const $$show = makeState(false);

  logLifecycle(ctx);

  const $label = $$show.as((t) => (t ? "Hide Text" : "Show Text"));

  // return h("div", { class: "example" }, [
  //   h("h3", "Conditional rendering with ", h("code", "when()")),
  //   h("div", [
  //     h(
  //       "button",
  //       {
  //         style: { width: 100 },
  //         onclick: () => {
  //           $$show.update((t) => !t);
  //         },
  //       },
  //       $label
  //     ),
  //     h.when(
  //       $$show,
  //       animated(
  //         h(
  //           "span",
  //           { style: { display: "inline-block", paddingLeft: "0.5rem" } },
  //           "Hello there!"
  //         )
  //       )
  //     ),
  //   ]),
  // ]);

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
  enter(ctx) {
    animate({
      from: { opacity: 0, y: -10 },
      to: { opacity: 1, y: 0 },
      duration: 200,
      onUpdate(latest) {
        ctx.node.style.opacity = latest.opacity;
        ctx.node.style.transform = `translateY(${latest.y}px)`;
      },
      onComplete() {
        ctx.done();
      },
    });
  },
  exit(ctx) {
    animate({
      from: { opacity: 1, y: 0 },
      to: { opacity: 0, y: 10 },
      duration: 200,
      onUpdate(latest) {
        ctx.node.style.opacity = latest.opacity;
        ctx.node.style.transform = `translateY(${latest.y}px)`;
      },
      onComplete() {
        ctx.done();
      },
    });
  },
});
