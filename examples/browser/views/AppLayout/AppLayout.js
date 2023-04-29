import {
  html,
  useName,
  useLoader,
  useConsole,
  useStore,
  useReadable,
  useAttributes,
  useOutlet,
  Readable,
} from "@borf/browser";
import { MouseStore } from "../../globals/MouseStore";
import styles from "./AppLayout.module.css";

export async function AppLayout() {
  useName("🐕");
  useLoader(html`<h1>This app is loading!</h1>`);

  const console = useConsole();

  console.log("hi");

  const page = useStore("page");
  const mouse = useStore(MouseStore);

  // Should throw an error that results in crash page being shown.
  // const crap = useStore("not-exist");
  // console.log(crap);

  // Display current mouse coordinates as tab title
  useReadable(mouse.$position, (pos) => {
    page.$$title.set(`x:${Math.round(pos.x)} y:${Math.round(pos.y)}`);
  });

  useReadable(page.$visibility, (status) => {
    console.log(`visibility: ${status}`);
  });

  return html`
    <div class=${styles.layout}>
      <nav class=${styles.nav}>
        <section class=${styles.navSection}>
          <header>
            <h3 class=${styles.navTitle}>Examples</h3>
          </header>

          <ul class=${styles.navList}>
            <li><${NavLink} path="/examples/spring-animation" name="Spring Animation" /></li>
            <li><${NavLink} path="/examples/languages" name="Languages" /></li>
            <li><${NavLink} path="/examples/crash-handling" name="Crash Handling" /></li>
            <li><${NavLink} path="/examples/counter-with-store" name="Counter with Store" /></li>
            <li><${NavLink} path="/examples/local-stores" name="Local Stores" /></li>
            <li><${NavLink} path="/examples/passing-attributes" name="Passing Attributes" /></li>
            <li><${NavLink} path="/examples/http-requests" name="HTTP Requests" /></li>
          </ul>
        </section>

        <section class=${styles.navSection}>
          <header>
            <h3 class=${styles.navTitle}>7GUIs</h3>
          </header>

          <ul class=${styles.navList}>
            <li><${NavLink} path="/7guis/counter" name="Counter" /></li>
            <li><${NavLink} path="/7guis/temp-converter" name="Temp Converter" /></li>
            <li><${NavLink} path="/7guis/flight-booker" name="Flight Booker" /></li>
            <li><${NavLink} path="/7guis/timer" name="Timer" /></li>
            <li><${NavLink} path="/7guis/crud" name="CRUD" /></li>
            <li><${NavLink} path="/7guis/circle-drawer" name="Circle Drawer" /></li>
            <li><${NavLink} path="/7guis/cells" name="Cells" /></li>
          </ul>
        </section>

        <section class=${styles.navSection}>
          <header>
            <h3 class=${styles.navTitle}>Tests</h3>
          </header>

          <ul class=${styles.navList}>
            <li><${NavLink} path="/router-test" name="Router Test" /></li>
            <li><${NavLink} path="/nested/one" name="Nested: #1" /></li>
            <li><${NavLink} path="/nested/two" name="Nested: #2" /></li>
            <li><${NavLink} path="/nested/invalid" name="Nested: Redirect *" /></li>
            <li><${NavLink} path="/tests/render-order" name="Render Order Test" /></li>
          </ul>
        </section>
      </div>

      ${useOutlet()}
    </div>
  `;
}

function NavLink() {
  const router = useStore("router");
  const { $ } = useAttributes();

  const $path = $("path");
  const $name = $("name");

  const $active = Readable.merge(
    [router.$path, $path],
    (routerPath, linkPath) => {
      return routerPath.startsWith(linkPath);
    }
  );

  return html`
    <a
      href=${$path}
      class=${{
        [styles.active]: $active,
      }}
    >
      ${$name}
    </a>
  `;
}
