import { m } from "@borf/browser";
import { ExampleFrame } from "../../views/ExampleFrame";

import styles from "./Languages.module.css";

const languageLabels = {
  "en-US": "American",
  "en-GB": "English",
  ja: "日本語",
};

export function Languages(self) {
  const { translate, setLanguage, supportedLanguages, $currentLanguage } =
    self.useStore("language");

  // TODO: Show a larger component with multiple translated strings to give a better example of what's actually happening here.
  // Possibly something with a few pieces of textual information and an image, like an ID card view.
  return m(ExampleFrame, { title: "Languages" }, [
    m.div(
      supportedLanguages.map((tag) => {
        return m.button(
          {
            class: {
              [styles.active]: $currentLanguage.map((lang) => {
                return lang === tag;
              }),
            },
            onclick: () => {
              setLanguage(tag);
            },
          },
          languageLabels[tag]
        );
      })
    ),
    m.p(translate("greeting")),
  ]);
}
