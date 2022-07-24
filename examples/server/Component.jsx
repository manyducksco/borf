import { Page } from "@woofjs/server";
import styles from "./Component.module.css";

export function Component() {
  return (
    <Page>
      <p class={styles.text}>
        This is some red text if everything works correctly.
      </p>
    </Page>
  );
}
