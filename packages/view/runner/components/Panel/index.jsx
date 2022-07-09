import { when } from "@woofjs/client";

import styles from "./index.module.css";

export default function Panel() {
  const $header = this.$attrs.get("header");

  // Pad content by default unless padded=false
  const $padded = this.$attrs.map((attrs) =>
    attrs.padded == null ? true : attrs.padded
  );

  return (
    <section class={styles.panel}>
      {when($header, <header class={styles.panelHeader}>{$header}</header>)}

      <div class={[styles.panelContent, { [styles.padded]: $padded }]}>
        {this.children}
      </div>
    </section>
  );
}
