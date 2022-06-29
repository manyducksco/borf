import styles from "./index.module.css";

import AboutPanel from "../AboutPanel";
import ActionsPanel from "../ActionsPanel";
import AttributesPanel from "../AttributesPanel";
import NavigationPanel from "../NavigationPanel";
import ViewPanel from "../ViewPanel";
import Sidebar from "../Sidebar";

export default ($attrs, self) => {
  self.debug.name = "AppLayout";

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
};
