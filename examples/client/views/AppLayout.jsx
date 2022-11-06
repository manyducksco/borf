import { makeTransitions, makeView } from "@woofjs/client";
import { animate } from "popmotion";
import logLifecycle from "../utils/logLifecycle";

const animated = makeTransitions({
  exit(ctx) {
    animate({
      from: 0,
      to: 100,
      duration: 500,
      onUpdate: function (latest) {
        ctx.node.style.transform = `translateY(${latest}%)`;
      },
      onComplete: function () {
        ctx.done();
      },
    });
  },
});

export function preloadAppLayout(ctx) {
  // When the .done() function is called, this content is removed and the real window is connected.
  ctx.show(
    animated(
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: "white",
          padding: "1rem",
          zIndex: 200,
        }}
      >
        <h1>WELCOME</h1>
        <p>This page has examples of things woof can do.</p>
        <p>
          Click the button below to demonstrate calling <code>done()</code> in a
          route component's loadRoute hook. When it's triggered by an event, you
          can create disclaimer pages like this. Generally you would use this to
          show temp content while making API calls.
        </p>
        <button
          onclick={() => ctx.done()}
          title="demonstrate calling done() in a component's preload hook"
        >
          Continue
        </button>
      </div>
    )
  );
}

export const AppLayout = makeView((ctx) => {
  ctx.name = "🐕";
  ctx.log("hi");

  logLifecycle(ctx);

  const page = ctx.global("page");
  const mouse = ctx.global("mouse");

  // Display current mouse coordinates as tab title
  ctx.observe(mouse.$position, (pos) => {
    page.$$title.set(`x:${Math.round(pos.x)} y:${Math.round(pos.y)}`);
  });

  ctx.observe(page.$visibility, (status) => {
    ctx.log(`visibility: ${status}`);
  });

  return (
    <div class="demo">
      <nav class="nav">
        <ul>
          <li>
            <a href="/examples">Examples</a>
          </li>
          <li>
            <a href="/7guis">7 GUIs</a>
          </li>
          <li>
            <a href="/router-test">Router Test</a>
          </li>
          <li>
            <a href="/nested/one">Nested: #1</a>
          </li>
          <li>
            <a href="/nested/two">Nested: #2</a>
          </li>
          <li>
            <a href="/nested/invalid">Nested: Redirect *</a>
          </li>
        </ul>
      </nav>

      {ctx.outlet()}
    </div>
  );
});
