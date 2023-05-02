import { Outlet } from "@borf/browser";
import styles from "./ExampleFrame.module.css";

export function ExampleFrame({ title, about }) {
  return (
    <article class={styles.frame}>
      <header class={styles.header}>
        <h2 class={styles.title}>{title}</h2>
      </header>

      {about && (
        <div class={styles.about}>
          <div class={styles.symbol}>⌘</div>
          <p>{about}</p>
        </div>
      )}

      <div class={styles.content}>
        <Outlet />
      </div>
    </article>
  );
}
