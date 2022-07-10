import { bind } from "@woofjs/client";

import styles from "./index.module.css";

/**
 * Provides a text input.
 */
export default function InputText() {
  this.debug.name = "input:text";

  const $ref = this.$attrs.get("$ref");
  const $value = this.$attrs.get("$value");

  return (
    <input type="text" class={styles.input} $ref={$ref} value={bind($value)} />
  );
}
