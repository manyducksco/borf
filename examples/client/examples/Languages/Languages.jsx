import { View } from "@frameworke/fronte";
import { ExampleFrame } from "../../views/ExampleFrame";
import logLifecycle from "../../utils/logLifecycle";

import styles from "./Languages.module.css";

export const Languages = View.define({
  label: "Languages",
  inputs: {},
  setup(ctx) {
    logLifecycle(ctx);
    const { t, setLanguage, $currentLanguage } = ctx.useStore("language");

    // TODO: Show a larger component with multiple translated strings to give a better example of what's actually happening here.
    // Possibly something with a few pieces of textual information and an image, like an ID card view.
    return (
      <ExampleFrame title="Languages">
        <div>
          <button
            class={{
              [styles.active]: $currentLanguage.as((x) => x === "en-US"),
            }}
            onclick={() => {
              setLanguage("en-US");
            }}
          >
            American
          </button>
          <button
            class={{
              [styles.active]: $currentLanguage.as((x) => x === "en-GB"),
            }}
            onclick={() => {
              setLanguage("en-GB");
            }}
          >
            English
          </button>
          <button
            class={{
              [styles.active]: $currentLanguage.as((x) => x === "ja"),
            }}
            onclick={() => {
              setLanguage("ja");
            }}
          >
            日本語
          </button>
        </div>
        <p>{t("greeting")}</p>
      </ExampleFrame>
    );
  },
});
