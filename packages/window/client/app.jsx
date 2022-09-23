import "./global.css";
import styles from "./app.module.css";

import woof from "@woofjs/client";

import screen from "./globals/screen.js";
import view from "./globals/view.js";

import AboutPanel from "./views/AboutPanel";
import ActionsPanel from "./views/ActionsPanel";
import AttributesPanel from "./views/AttributesPanel";
import NavigationPanel from "./views/NavigationPanel";
import ViewPanel from "./views/ViewPanel";
import Sidebar from "./views/Sidebar";

const app = woof();

app.global("screen", screen);
app.global("view", view);

app.route("*", function () {
  return (
    <div class={styles.app}>
      <main class={styles.main}>
        <Sidebar id="nav" resizeHandle="right">
          <NavigationPanel />
        </Sidebar>

        <ViewPanel />

        <Sidebar id="attrs" resizeHandle="left">
          <AboutPanel />
          <AttributesPanel />
          <ActionsPanel />
        </Sidebar>
      </main>
    </div>
  );
});

app.connect("#app");
