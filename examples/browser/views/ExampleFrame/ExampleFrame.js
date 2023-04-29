import { html, useAttributes, useOutlet } from "@borf/browser";
import styles from "./ExampleFrame.module.css";

export function ExampleFrame() {
  const attrs = useAttributes();

  const { title, about } = attrs.get();

  return html`
    <article class=${styles.frame}>
      <header class=${styles.header}>
        <h2 class=${styles.title}>${title}</h2>
      </header>

      ${about &&
      html`<div class=${styles.about}>
        <div class=${styles.symbol}>⌘</div>
        <p>${about}</p>
      </div>`}

      <div class=${styles.content}>${useOutlet()}</div>
    </article>
  `;
}
