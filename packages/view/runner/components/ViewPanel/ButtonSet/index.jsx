import { repeat } from "@woofjs/client";

import styles from "./index.module.css";

export default ($attrs, self) => {
  const $items = $attrs.map("items");

  return (
    <div class={styles.container}>
      {repeat($items, ($attrs, self) => {
        const $label = $attrs.map("value.label");
        const $onclick = $attrs.map("value.onclick");

        return (
          <button class={styles.button} onclick={$onclick}>
            {$label}
          </button>
        );
      })}
    </div>
  );
};
