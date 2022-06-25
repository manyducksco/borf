import { bind } from "@woofjs/client";

import styles from "./index.module.css";

export default ($attrs, self) => {
  self.debug.name = "input:number";

  const $value = $attrs.get("$value");

  return <input type="number" class={styles.input} value={bind($value)} />;
};
