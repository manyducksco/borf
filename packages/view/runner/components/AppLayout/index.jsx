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
      <header class={styles.header}>HEADER</header>

      <main class={styles.main}>
        <Sidebar id="nav" resizeHandle="right">
          <NavigationPanel />
        </Sidebar>

        <iframe class={styles.iframe} $ref={$frameRef} src="/frame.html" />

        <Sidebar id="attrs" resizeHandle="left">
          <AttributesPanel />
          <ActionsPanel />
        </Sidebar>
      </main>
    </div>
  );
};
