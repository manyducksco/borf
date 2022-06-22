import styles from "./index.module.css";

/**
 * Displays the current view's attributes and provides inputs for editing them.
 */
export default ($attrs, self) => {
  self.debug.name = "AttributesPanel";

  return <div class={styles.panel}>Attributes</div>;
};
