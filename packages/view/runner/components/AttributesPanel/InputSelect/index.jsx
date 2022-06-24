import { repeat, mergeStates } from "@woofjs/client";

export default ($attrs, self) => {
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

        return <option value={$key}>{$value}</option>;
      })}
    </select>
  );
};
