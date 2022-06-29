import "./global.css";
import styles from "./runner.module.css";

import { makeApp } from "@woofjs/client";

import screen from "./services/screen.js";
import view from "./services/view.js";

import AboutPanel from "./components/AboutPanel";
import ActionsPanel from "./components/ActionsPanel";
import AttributesPanel from "./components/AttributesPanel";
import NavigationPanel from "./components/NavigationPanel";
import ViewPanel from "./components/ViewPanel";
import Sidebar from "./components/Sidebar";

const app = makeApp();

app.service("screen", screen);
app.service("view", view);

app.route("*", () => {
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
