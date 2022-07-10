import { makeState } from "@woofjs/client";

import styles from "./index.module.css";

export default function AttributesOverlay() {
  this.debug.name = "AttributesOverlay";

  const $ref = makeState();

  this.watchState(this.$attrs, (attrs) => {
    const json = JSON.stringify(
      attrs.value,
      (key, value) => {
        if (typeof value === "function") {
          return "[[FUNCTION]]";
        }

        if (typeof value === "object" && value.isState) {
          return "[[STATE]]";
        }

        return value;
      },
      2
    );

    $ref.get().innerHTML = highlight(json);
  });

  return (
    <div class={styles.overlay}>
      <header class={styles.header}>
        <h3>Attribute Values</h3>
      </header>
      <div class={styles.json} $ref={$ref} />
    </div>
  );
}

/**
 * Credit to twilson63's github gist: https://gist.github.com/twilson63/e8893770722fad8518513dfdbe018a23
 *
 * Copied and tweaked slightly.
 */
function highlight(json) {
  json = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = styles.number;

      if (match === '"[[FUNCTION]]"') {
        return `<span class="${styles.function}">function</span>`;
      } else if (match === '"[[STATE]]"') {
        return `<span class="${styles.state}">$state</span>`;
      } else if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = styles.key;
        } else {
          cls = styles.string;
        }
      } else if (/true|false/.test(match)) {
        cls = styles.boolean;
      } else if (/null/.test(match)) {
        cls = styles.null;
      }

      return `<span class="${cls}">${match}</span>`;
    }
  );
}
