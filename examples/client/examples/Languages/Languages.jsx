import { View } from "woofe";
import { ExampleFrame } from "../../views/ExampleFrame";
import logLifecycle from "../../utils/logLifecycle";

import styles from "./Languages.module.css";

export class Languages extends View {
  static inputs = {};

  setup(ctx, m) {
    logLifecycle(ctx);
    const { t, setLanguage, $currentLanguage } = ctx.useStore("language");

    // TODO: Show a larger component with multiple translated strings to give a better example of what's actually happening here.
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
  }
}
