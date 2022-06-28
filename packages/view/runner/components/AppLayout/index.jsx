import styles from "./index.module.css";

import ActionsPanel from "../ActionsPanel";
import AttributesPanel from "../AttributesPanel";
import NavigationPanel from "../NavigationPanel";
import ViewPanel from "../ViewPanel";
import Sidebar from "../Sidebar";

export default ($attrs, self) => {
  self.debug.name = "AppLayout";

  return (
    <div class={styles.app}>
      {/* <div class={styles.header}>
        <h1 class={styles.logoText}>
          @woofjs/<span class={styles.logoAccent}>view</span>
        </h1>
      </div> */}
      <main class={styles.main}>
        <Sidebar id="nav" resizeHandle="right">
          <NavigationPanel />
        </Sidebar>

        <ViewPanel />

        <Sidebar id="attrs" resizeHandle="left">
          <AttributesPanel />
          <ActionsPanel />
        </Sidebar>
      </main>
    </div>
  );
};
