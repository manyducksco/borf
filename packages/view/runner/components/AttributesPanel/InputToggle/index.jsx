export default ($attrs, self) => {
  self.debug.name = "input:toggle";

  const $value = $attrs.get("$value");

  return (
    <input
      type="checkbox"
      checked={$value}
      onchange={() => {
        $value.set((on) => !on);
      }}
    />
  );
};
