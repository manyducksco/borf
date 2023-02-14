import { View } from "woofe";
import { ExampleFrame } from "../../views/ExampleFrame";

import styles from "./Languages.module.css";

export class Languages extends View {
  static inputs = {};

  setup(ctx, m) {
    const { t, setLanguage, $currentLanguage } = ctx.useStore("language");

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
