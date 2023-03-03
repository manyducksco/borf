import { View } from "@frameworke/fronte";

import styles from "./ExampleFrame.module.css";

export class ExampleFrame extends View {
  static inputs = {
    title: {
      type: "string",
    },
    about: {
      type: "string",
      optional: true,
    },
  };

  setup(ctx, m) {
    const { title, about } = ctx.inputs.get();

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
        <div class={styles.content}>{ctx.outlet()}</div>
      </article>
    );
  }
}
