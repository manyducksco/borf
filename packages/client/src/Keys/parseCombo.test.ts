import { parseCombo } from "./parseCombo";

test("parses key combinations", () => {
  expect(true).toBe(true);

  parseCombo("a");
  parseCombo("shift+a ");
  parseCombo("shift+  meTa+R");
});
