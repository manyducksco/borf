import dedent from "dedent";

import styles from "./index.module.css";

/**
 * A read-only display of the value with no interactivity.
 */
export default function InputNone() {
  this.debug.name = "input:none";

  const $value = this.$attrs.map("value", (value) => {
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }

    return dedent(String(value));
  });

  return <div class={styles.container}>{$value}</div>;
}
