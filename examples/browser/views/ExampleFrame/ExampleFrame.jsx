import { Readable, cond } from "@borf/browser";
import styles from "./ExampleFrame.module.css";

export function ExampleFrame(props, c) {
  const $title = Readable.from(props.title);
  const $about = Readable.from(props.about);

  return (
    <article class={styles.frame}>
      <header class={styles.header}>
        <h2 class={styles.title}>{$title}</h2>
      </header>

      {cond(
        $about,
        <div class={styles.about}>
          <div class={styles.symbol}>⌘</div>
          <p>{$about}</p>
        </div>
      )}

      <div class={styles.content}>{c.outlet()}</div>
    </article>
  );
}
