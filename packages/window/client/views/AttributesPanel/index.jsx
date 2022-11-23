import { makeView } from "@woofjs/client";

import styles from "./index.module.css";

import Panel from "../Panel";

import InputColor from "./InputColor";
import InputDate from "./InputDate";
import InputNone from "./InputNone";
import InputNumber from "./InputNumber";
import InputRadio from "./InputRadio";
import InputRange from "./InputRange";
import InputSelect from "./InputSelect";
import InputText from "./InputText";
import InputToggle from "./InputToggle";

/**
 * Displays the current window's attributes and provides inputs for editing them.
 */
export default makeView((ctx, h) => {
  this.debug.name = "AttributesPanel";

  const { $currentView } = this.services.view;

  const $attributes = $currentView.map((view) => {
    return view?.attributes || [];
  });
  const $hasAttrs = $attributes.map((attrs) => attrs.length > 0);

  return (
    <Panel header={<h1>🎛️ Attributes</h1>}>
      {h.unless($hasAttrs, <p>This view has no attributes.</p>)}

      {h.when(
        $hasAttrs,
        <ul class={styles.attrsList}>
          {h.repeat($attributes, ($attribute) => {
            const $name = $attribute.as((x) => x.name);
            const $description = $attribute.as((x) => x.description);

            // Using a proxy to have one state that can point to other states over time.
            const $value = makeProxyState($attribute.get("$value"));

            // Update which state the proxy points to when the attribute changes.
            this.watchState($attribute, (attr) => {
              $value.proxy(attr.$value);
            });

            return (
              <li class={styles.attrGroup}>
                <h2 class={styles.attrHeader}>{$name}</h2>

                {h.when(
                  $description,
                  <p class={styles.attrDescription}>{$description}</p>
                )}

                {h.match($attribute, [
                  ["text", <InputText $value={$value} />],
                  ["number", <InputNumber $value={$value} />],
                  ["toggle", <InputToggle $value={$value} />],
                  ["color", <InputColor $value={$value} />],
                  ["date", <InputDate $value={$value} />],
                  [
                    "select",
                    ({ input }) => (
                      <InputSelect $value={$value} options={input.options} />
                    ),
                  ],
                  [
                    "radio",
                    ({ input }) => (
                      <InputRadio $value={$value} options={input.options} />
                    ),
                  ],
                  [
                    "range",
                    ({ input }) => (
                      <InputRange
                        $value={$value}
                        min={input.min}
                        max={input.max}
                        step={input.step}
                      />
                    ),
                  ],
                  ["none", <InputNone value={$value} />],
                  ({ input }) =>
                    throw new Error(`Unknown input type: ${input.type}`),
                ])}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
});
