import { View, State } from "@borf/browser";
import { ExampleFrame } from "../../views/ExampleFrame";
import logLifecycle from "../../utils/logLifecycle";

import styles from "./Languages.module.css";

const languageLabels = {
  "en-US": "American",
  "en-GB": "English",
  ja: "日本語",
};

export const Languages = View.define({
  label: "Languages",
  setup(ctx, m) {
    logLifecycle(ctx);
    const { translate, setLanguage, supportedLanguages, $currentLanguage } =
      ctx.useStore("language");

    // TODO: Show a larger component with multiple translated strings to give a better example of what's actually happening here.
    // Possibly something with a few pieces of textual information and an image, like an ID card view.
    return (
      <ExampleFrame title="Languages">
        <div>
          {m.repeat(supportedLanguages, ($tag) => {
            return (
              <button
                class={{
                  [styles.active]: State.merge(
                    $currentLanguage,
                    $tag,
                    (lang, tag) => {
                      return lang === tag;
                    }
                  ),
                }}
                onclick={() => {
                  setLanguage($tag.get());
                }}
              >
                {$tag.as((t) => languageLabels[t])}
              </button>
            );
          })}
        </div>
        <p>{translate("greeting")}</p>
      </ExampleFrame>
    );
  },
});
