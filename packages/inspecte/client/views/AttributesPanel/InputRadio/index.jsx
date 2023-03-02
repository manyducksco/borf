import { repeat, mergeStates } from "@woofjs/client";
import { nanoid } from "nanoid";

import styles from "./index.module.css";

export default function InputRadio() {
  this.debug.name = "input:radio";

  const id = nanoid();

  const $options = this.$attrs.map("options");
  const $value = this.$attrs.get("$value");

  const $keyed = $options.map((options) => {
    return options.map((o, i) => {
      return {
        value: o,
        key: i,
      };
    });
  });

  const $selected = mergeStates($keyed, $value, (keyed, value) => {
    const match = keyed.find((entry) => entry.value === value);

    if (match) {
      return match.key;
    }
  });

  function makeOnChange($key) {
    return (e) => {
      e.preventDefault();

      const key = $key.get();
      const matched = $keyed.get().find((keyed) => keyed.key === key);

      $value.set(matched.value);
    };
  }

  return (
    <div>
      {repeat($keyed, function Option() {
        const $key = this.$attrs.map("value.key");
        const $label = this.$attrs.map("value.value");
        const $checked = mergeStates($key, $selected, (key, selected) => {
          return key === selected;
        });

        return (
          <div class={styles.group}>
            <input
              type="radio"
              name={`radio_${id}`}
              checked={$checked}
              onchange={makeOnChange($key)}
            />
            <span class={styles.label}>{$label}</span>
          </div>
        );
      })}
    </div>
  );
}
