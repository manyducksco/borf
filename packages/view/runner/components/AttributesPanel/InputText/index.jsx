import { bind } from "@woofjs/client";

import styles from "./index.module.css";

/**
 * Provides a text input.
 */
export default ($attrs, self) => {
  self.debug.name = "input:text";

  const $ref = $attrs.get("$ref");
  const $value = $attrs.get("$value");

  return (
    <input type="text" class={styles.input} $ref={$ref} value={bind($value)} />
  );
};
