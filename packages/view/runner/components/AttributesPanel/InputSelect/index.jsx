import { repeat, mergeStates } from "@woofjs/client";

import styles from "./index.module.css";

export default ($attrs, self) => {
  self.debug.name = "input:select";

  const $options = $attrs.map("options");
  const $value = $attrs.get("$value");

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
      {repeat($keyed, ($attrs, self) => {
        const $key = $attrs.map("value.key");
        const $value = $attrs.map("value.value");
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
};
