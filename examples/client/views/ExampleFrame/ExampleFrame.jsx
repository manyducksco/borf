import { View } from "woofe";

import styles from "./ExampleFrame.module.css";

export class ExampleFrame extends View {
  setup(ctx) {
    return <div class={styles.frame}>{ctx.outlet()}</div>;
  }
}
