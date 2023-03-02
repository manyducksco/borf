export default function InputToggle() {
  this.debug.name = "input:toggle";

  const $value = this.$attrs.get("$value");

  return (
    <input
      type="checkbox"
      checked={$value}
      onchange={() => {
        $value.set((on) => !on);
      }}
    />
  );
}
