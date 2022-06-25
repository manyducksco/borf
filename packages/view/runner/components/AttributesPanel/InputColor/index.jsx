import { bind } from "@woofjs/client";

export default ($attrs, self) => {
  self.debug.name = "input:color";

  const $value = $attrs.get("$value");

  return <input type="color" value={bind($value)} />;
};
