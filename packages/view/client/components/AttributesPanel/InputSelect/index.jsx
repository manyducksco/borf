import { repeat, mergeStates } from "@woofjs/client";

import styles from "./index.module.css";

export default function InputSelect() {
  this.debug.name = "input:select";

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

  return (
    <select
      class={styles.input}
      onchange={(e) => {
        e.preventDefault();

        const key = Number(e.target.value);
        const matched = $keyed.get().find((keyed) => keyed.key === key);

        $value.set(matched.value);
      }}
    >
      {repeat($keyed, function Option() {
        const $key = this.$attrs.map("value.key");
        const $value = this.$attrs.map("value.value");
        const $active = mergeStates(
          $selected,
          $key,
          (selected, key) => selected === key
        );

        return (
          <option value={$key} selected={$active}>
            {$value}
          </option>
        );
      })}
    </select>
  );
}
