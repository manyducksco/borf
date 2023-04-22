import { m } from "@borf/browser";

import styles from "./ExampleFrame.module.css";

export function ExampleFrame(self) {
  const { title, about } = self.inputs.get();

  return m("article", { class: styles.frame }, [
    m("header", { class: styles.header }, [
      m("h2", { class: styles.title }, title),
    ]),

    about &&
      m("div", { class: styles.about }, [
        m("div", { class: styles.symbol }, "⌘"),
        m("p", about),
      ]),

    m("div", { class: styles.content }, self.outlet()),
  ]);
}
