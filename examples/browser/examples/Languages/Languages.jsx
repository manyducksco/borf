import { View } from "@borf/browser";
import { ExampleFrame } from "../../views/ExampleFrame";

import styles from "./Languages.module.css";

const languageLabels = {
  "en-US": "American",
  "en-GB": "English",
  ja: "日本語",
};

export const Languages = new View({
  label: "Languages",
  setup(ctx, m) {
    const { translate, setLanguage, supportedLanguages, $currentLanguage } =
      ctx.useStore("language");

    // TODO: Show a larger component with multiple translated strings to give a better example of what's actually happening here.
    // Possibly something with a few pieces of textual information and an image, like an ID card view.
    return (
      <ExampleFrame title="Languages">
        <div>
          {supportedLanguages.map((tag) => {
            return (
              <button
                class={{
                  [styles.active]: $currentLanguage.map((lang) => {
                    return lang === tag;
                  }),
                }}
                onclick={() => {
                  setLanguage(tag);
                }}
              >
                {languageLabels[tag]}
              </button>
            );
          })}
        </div>
        <p>{translate("greeting")}</p>
      </ExampleFrame>
    );
  },
});
