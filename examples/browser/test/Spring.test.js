import { Spring } from "@borf/browser";
import { describe, test } from "vitest";

test("test", (t) => {
  const spring = new Spring();

  t.expect(spring.value).toBe(0);
});
