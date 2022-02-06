import { makeNode } from "./makeNode.js";

/**
 * Displays one or more children without a parent element.
 */
export const makeFragment = makeNode((self, children) => {
  self.connected(() => {
    let after = self.element;

    for (const child of children) {
      child.connect(self.element.parentNode, after);
      after = child.element;
    }
  });

  self.disconnected(() => {
    for (const child of children) {
      child.disconnect();
    }
  });

  return document.createTextNode("");
});
