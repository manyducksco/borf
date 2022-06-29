import styles from "./index.module.css";
import Panel from "../Panel";

export default ($attrs, self) => {
  const { $currentView } = self.getService("view");

  const $description = $currentView.map((view) => {
    if (view) {
      return view.description || "View has no description.";
    } else {
      return "No view selected.";
    }
  });

  return (
    <Panel header={<h1>ℹ️ About</h1>}>
      <div class={styles.description}>{$description}</div>
    </Panel>
  );
};
