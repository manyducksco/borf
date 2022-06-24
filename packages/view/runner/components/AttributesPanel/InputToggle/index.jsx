export default ($attrs, self) => {
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
