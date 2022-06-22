import styles from "./index.module.css";

/**
 * Generic sidebar component with resizing logic.
 */
export default ($attrs, self) => {
  self.debug.name = "Sidebar";

  return <div class={styles.sidebar}>SIDEBAR</div>;
};
