import { bind } from "@woofjs/client";

export default ($attrs, self) => {
  const $value = $attrs.get("$value");

  return <input type="color" value={bind($value)} />;
};
