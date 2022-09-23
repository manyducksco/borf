import { repeat } from "@woofjs/client";

import styles from "./index.module.css";

export default function ButtonSet() {
  const $items = this.$attrs.map("items");

  return (
    <div class={styles.container}>
      {repeat($items, function Button() {
        const $label = this.$attrs.map("value.label");
        const $onclick = this.$attrs.map("value.onclick");

        return (
          <button class={styles.button} onclick={$onclick}>
            {$label}
          </button>
        );
      })}
    </div>
  );
}
