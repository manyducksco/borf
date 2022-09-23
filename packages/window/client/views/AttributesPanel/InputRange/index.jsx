import { bind } from "@woofjs/client";

import styles from "./index.module.css";

export default function InputRange() {
  this.debug.name = "input:range";

  const $value = this.$attrs.get("$value");
  const $min = this.$attrs.map("min");
  const $max = this.$attrs.map("max");
  const $step = this.$attrs.map("step");

  return (
    <input
      class={styles.input}
      type="range"
      value={bind($value)}
      min={$min}
      max={$max}
      step={$step}
    />
  );
}
