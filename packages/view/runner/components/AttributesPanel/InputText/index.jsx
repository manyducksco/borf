import { bind } from "@woofjs/client";

/**
 * Provides a text input.
 */
export default ($attrs, self) => {
  const $ref = $attrs.get("$ref");
  const $value = $attrs.get("$value");

  return <input type="text" $ref={$ref} value={bind($value)} />;
};
