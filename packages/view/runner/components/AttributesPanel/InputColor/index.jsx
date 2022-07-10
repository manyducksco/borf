import { bind } from "@woofjs/client";

import styles from "./index.module.css";

export default function InputColor() {
  this.debug.name = "input:color";

  const $value = this.$attrs.get("$value");

  return <input class={styles.input} type="color" value={bind($value)} />;
}
