import { makeView } from "@woofjs/client";
import styles from "./index.module.css";
import Panel from "../Panel";

export default makeView(function AboutPanel(ctx) {
  const { $currentView } = ctx.global("view");

  const $description = $currentView.map((view) => {
    if (view) {
      return view.description || "View has no description.";
    } else {
      return "No window selected.";
    }
  });

  return (
    <Panel header={<h1>ℹ️ About</h1>}>
      <div class={styles.description}>{$description}</div>
    </Panel>
  );
});
