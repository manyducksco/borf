import styles from "./index.module.css";

/**
 * A read-only display of the value with no interactivity.
 */
export default ($attrs, self) => {
  self.debug.name = "input:none";

  const $value = $attrs.map("value", (value) => {
    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  });

  return <div class={styles.container}>{$value}</div>;
};
