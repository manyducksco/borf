import { bind } from "@woofjs/client";

import styles from "./index.module.css";

export default ($attrs, self) => {
  self.debug.name = "input:color";

  const $value = $attrs.get("$value");

  return <input class={styles.input} type="color" value={bind($value)} />;
};
