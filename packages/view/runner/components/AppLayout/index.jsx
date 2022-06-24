import styles from "./index.module.css";

import AttributesPanel from "../AttributesPanel";
import NavigationPanel from "../NavigationPanel";
import Sidebar from "../Sidebar";

export default ($attrs, self) => {
  self.debug.name = "AppLayout";

  const { $params } = self.getService("@router");
  const { $frameRef } = self.getService("view");

  self.watchState($params.map("wildcard"), self.debug.log);

  return (
    <div class={styles.app}>
      <header class={styles.header}>HEADER</header>
      <main class={styles.main}>
        <Sidebar id="nav">
          <NavigationPanel />
        </Sidebar>
        <iframe class={styles.iframe} $ref={$frameRef} src="/frame.html" />
        <Sidebar id="attrs">
          <AttributesPanel />
        </Sidebar>
      </main>
    </div>
  );
};
