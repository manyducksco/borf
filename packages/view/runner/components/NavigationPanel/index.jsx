import styles from "./index.module.css";

/**
 * Displays a tree of all views and links to navigate to each.
 */
export default ($attrs, self) => {
  self.debug.name = "NavigationPanel";

  return <div class={styles.panel}>Navigation</div>;
};
