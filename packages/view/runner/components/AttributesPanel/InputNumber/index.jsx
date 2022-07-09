import { bind } from "@woofjs/client";

import styles from "./index.module.css";

export default function InputNumber() {
  this.debug.name = "input:number";

  const $value = this.$attrs.get("$value");

  return <input type="number" class={styles.input} value={bind($value)} />;
}
