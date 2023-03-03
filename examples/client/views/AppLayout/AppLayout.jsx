import { View } from "@frameworke/fronte";
import { MouseStore } from "../../globals/MouseStore";
import logLifecycle from "../../utils/logLifecycle";

import styles from "./AppLayout.module.css";

export const AppLayout = View.define({
  label: "🐕",
  about:
    "Top level layout for the app. All other routes are rendered in this one's ctx.outlet()",
  inputs: {},

  loading() {
    return <h1>This app is loading!</h1>;
  },

  async setup(ctx) {
    ctx.log("hi");

    // await new Promise((resolve) => {
    //   setTimeout(resolve, 400);
    // });

    logLifecycle(ctx);

    const router = ctx.useStore("router");
    const page = ctx.useStore("page");
    const mouse = ctx.useStore(MouseStore);

    // Display current mouse coordinates as tab title
    ctx.observe(mouse.$position, (pos) => {
      page.$$title.set(`x:${Math.round(pos.x)} y:${Math.round(pos.y)}`);
    });

    ctx.observe(page.$visibility, (status) => {
      ctx.log(`visibility: ${status}`);
    });

    const navLink = (href, label) => {
      return (
        <a
          href={href}
          class={{
            [styles.active]: router.$path.as((x) => x.startsWith(href)),
          }}
        >
          {label}
        </a>
      );
    };

    return (
      <div class={styles.layout}>
        <nav class={styles.nav}>
          <section class={styles.navSection}>
            <header>
              <h3 class={styles.navTitle}>Examples</h3>
            </header>

            <ul class={styles.navList}>
              <li>
                {navLink("/examples/spring-animation", "Spring Animation")}
              </li>
              <li>{navLink("/examples/languages", "Languages")}</li>
              <li>{navLink("/examples/crash-handling", "Crash Handling")}</li>
              <li>
                {navLink("/examples/counter-with-store", "Counter with Store")}
              </li>
              <li>{navLink("/examples/local-stores", "Local Stores")}</li>
            </ul>
          </section>

          <section class={styles.navSection}>
            <header>
              <h3 class={styles.navTitle}>7 GUIs</h3>
            </header>

            <ol class={styles.navList}>
              <li>{navLink("/7guis/counter", "Counter")}</li>
              <li>
                {navLink("/7guis/temp-converter", "Temperature Converter")}
              </li>
              <li>{navLink("/7guis/flight-booker", "Flight Booker")}</li>
              <li>{navLink("/7guis/timer", "Timer")}</li>
              <li>{navLink("/7guis/crud", "CRUD")}</li>
              <li>{navLink("/7guis/circle-drawer", "Circle Drawer")}</li>
              <li>{navLink("/7guis/cells", "Cells")}</li>
            </ol>
          </section>

          <section class={styles.navSection}>
            <header>
              <h3 class={styles.navTitle}>Tests</h3>
            </header>

            <ul class={styles.navList}>
              <li>{navLink("/router-test", "Router Test")}</li>
              <li>{navLink("/nested/one", "Nested: #1")}</li>
              <li>{navLink("/nested/two", "Nested: #2")}</li>
              <li>{navLink("/nested/invalid", "Nested: Redirect *")}</li>
              <li>{navLink("/tests/render-order", "Render Order Test")}</li>
            </ul>
          </section>
        </nav>

        <div class={styles.content}>{ctx.outlet()}</div>
      </div>
    );
  },
});
