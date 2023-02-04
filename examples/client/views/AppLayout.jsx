import { View, makeState } from "woofe";
import { MouseStore } from "../globals/MouseStore";
import logLifecycle from "../utils/logLifecycle";

export class AppLayout extends View {
  static label = "🐕"; // Override class name label in debug messages
  static about =
    "Top level layout for the app. All other routes are rendered in this one's ctx.outlet()";
  static attrs = {};

  loading() {
    return <h1>This app is loading!</h1>;
  }

  async setup(ctx) {
    ctx.log("hi");

    await new Promise((resolve) => {
      setTimeout(resolve, 400);
    });

    logLifecycle(ctx);

    const page = ctx.useStore("page");
    const mouse = ctx.useStore(MouseStore);

    // Display current mouse coordinates as tab title
    ctx.observe(mouse.$position, (pos) => {
      page.$$title.set(`x:${Math.round(pos.x)} y:${Math.round(pos.y)}`);
    });

    ctx.observe(page.$visibility, (status) => {
      ctx.log(`visibility: ${status}`);
    });

    const $$webComponentTest = makeState("app layout");

    return (
      <div class="demo">
        <web-component-view location={$$webComponentTest}></web-component-view>

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
  }
}
