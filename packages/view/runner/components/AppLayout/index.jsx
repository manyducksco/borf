import styles from "./index.module.css";

import ActionsPanel from "../ActionsPanel";
import AttributesPanel from "../AttributesPanel";
import NavigationPanel from "../NavigationPanel";
import Sidebar from "../Sidebar";

export default ($attrs, self) => {
  self.debug.name = "AppLayout";

  const { $frameRef } = self.getService("view");

  return (
    <div class={styles.app}>
      <main class={styles.main}>
        <Sidebar id="nav" resizeHandle="right">
          <NavigationPanel />
        </Sidebar>

        <div class={styles.canvas}>
          <header class={styles.canvasHeader}>HEADER</header>
          <iframe class={styles.iframe} $ref={$frameRef} src="/frame.html" />
        </div>

        <Sidebar id="attrs" resizeHandle="left">
          <AttributesPanel />
          <ActionsPanel />
        </Sidebar>
      </main>
    </div>
  );
};
