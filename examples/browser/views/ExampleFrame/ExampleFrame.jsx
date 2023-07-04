import { Readable, when } from "@borf/browser";
import styles from "./ExampleFrame.module.css";

export function ExampleFrame(attrs, ctx) {
  const $title = Readable.from(attrs.title);
  const $about = Readable.from(attrs.about);

  return (
    <article class={styles.frame}>
      <header class={styles.header}>
        <h2 class={styles.title}>{$title}</h2>
      </header>

      {when(
        $about,
        <div class={styles.about}>
          <div class={styles.symbol}>⌘</div>
          <p>{$about}</p>
        </div>
      )}

      <div class={styles.content}>{ctx.outlet()}</div>
    </article>
  );
}
