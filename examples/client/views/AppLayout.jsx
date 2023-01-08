import {
  makeTransitions,
  withTransitions,
  makeView,
  makeState,
  makeSpring,
} from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle";

const slideInOut = makeTransitions((ctx) => {
  const y = makeSpring(0, { stiffness: 100, damping: 100 });

  ctx.enter(() => y.to(0));
  ctx.exit(() => y.to(100));

  return {
    transform: y.as((y) => `translateY(${y}%)`),
  };
});

export function preloadAppLayout(ctx) {
  return new Promise((resolve) => {
    const PreloadView = makeView(withTransitions(slideInOut), (ctx) => {
      const $transform = ctx.attrs.readable("transform");

      return (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "white",
            padding: "1rem",
            zIndex: 200,
            transform: $transform,
          }}
        >
          <h1>WELCOME</h1>
          <p>This page has examples of things woof can do.</p>
          <p>
            Click the button below to demonstrate calling <code>done()</code> in
            a route component's loadRoute hook. When it's triggered by an event,
            you can create disclaimer pages like this. Generally you would use
            this to show temp content while making API calls.
          </p>
          <button
            onclick={() => resolve()}
            title="demonstrate calling done() in a component's preload hook"
          >
            Continue
          </button>
        </div>
      );
    });

    // When the promise is resolved, this content is removed and the real view is connected.
    ctx.show(<PreloadView />);
  });
}

export const AppLayout = makeView((ctx) => {
  ctx.name = "🐕";
  ctx.log("hi");

  logLifecycle(ctx);

  const page = ctx.global("@page");
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
