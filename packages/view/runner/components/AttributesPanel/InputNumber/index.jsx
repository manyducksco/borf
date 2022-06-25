import { bind } from "@woofjs/client";

export default ($attrs, self) => {
  self.debug.name = "input:number";

  const $value = $attrs.get("$value");

  return <input type="number" value={bind($value)} />;
};
