import { bind } from "@woofjs/client";

import styles from "./index.module.css";

export default ($attrs, self) => {
  self.debug.name = "input:range";

  const $value = $attrs.get("$value");
  const $min = $attrs.map("min");
  const $max = $attrs.map("max");
  const $step = $attrs.map("step");

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
};
