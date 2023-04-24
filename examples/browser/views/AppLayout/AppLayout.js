import { m, useStore } from "@borf/browser";
import { MouseStore } from "../../globals/MouseStore";
import styles from "./AppLayout.module.css";

export async function AppLayout(self) {
  self.setName("🐕");
  self.setLoader(m.h1("This app is loading!"));

  self.debug.log("hi");

  // const router = self.useStore("router");
  // const page = self.useStore("page");
  // const mouse = self.useStore(MouseStore);

  const router = useStore("router");
  const page = useStore("page");
  const mouse = useStore(MouseStore);

  // Display current mouse coordinates as tab title
  self.observe(mouse.$position, (pos) => {
    page.$$title.set(`x:${Math.round(pos.x)} y:${Math.round(pos.y)}`);
  });

  self.observe(page.$visibility, (status) => {
    self.debug.log(`visibility: ${status}`);
  });

  const navLink = (href, label) => {
    return m.a(
      {
        href,
        class: { [styles.active]: router.$path.map((x) => x.startsWith(href)) },
      },
      label
    );
  };

  return m.div({ class: styles.layout }, [
    m.nav({ class: styles.nav }, [
      m.section({ class: styles.navSection }, [
        m.header(m.h3({ class: styles.navTitle }, "Examples")),

        m.ul({ class: styles.navList }, [
          m.li(navLink("/examples/spring-animation", "Spring Animation")),
          m.li(navLink("/examples/languages", "Languages")),
          m.li(navLink("/examples/crash-handling", "Crash Handling")),
          m.li(navLink("/examples/counter-with-store", "Counter with Store")),
          m.li(navLink("/examples/local-stores", "Local Stores")),
          m.li(navLink("/examples/passing-attributes", "Passing Attributes")),
        ]),
      ]),

      m.section({ class: styles.navSection }, [
        m.header(m.h3({ class: styles.navTitle }, "7GUIs")),

        m.ul({ class: styles.navList }, [
          m.li(navLink("/7guis/counter", "Counter")),
          m.li(navLink("/7guis/temp-converter", "Temperature Converter")),
          m.li(navLink("/7guis/flight-booker", "Flight Booker")),
          m.li(navLink("/7guis/timer", "Timer")),
          m.li(navLink("/7guis/crud", "CRUD")),
          m.li(navLink("/7guis/circle-drawer", "Circle Drawer")),
          m.li(navLink("/7guis/cells", "Cells")),
        ]),
      ]),

      m.section({ class: styles.navSection }, [
        m.header(m.h3({ class: styles.navTitle }, "Tests")),

        m.ul({ class: styles.navList }, [
          m.li(navLink("/router-test", "Router Test")),
          m.li(navLink("/nested/one", "Nested: #1")),
          m.li(navLink("/nested/two", "Nested: #2")),
          m.li(navLink("/nested/invalid", "Nested: Redirect *")),
          m.li(navLink("/tests/render-order", "Render Order Test")),
        ]),
      ]),
    ]),

    self.outlet(),
  ]);
}
