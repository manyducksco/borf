import { makeComponent } from "../../makeComponent.js";

/**
 * Displays one or more children without a parent element.
 */
export const Fragment = makeComponent((_, self) => {
  const node = document.createTextNode("");

  self.connected(() => {
    let after = node;

    for (const child of self.children) {
      child.connect(node.parentNode, after);
      after = child.element;
    }
  });

  self.disconnected(() => {
    for (const child of self.children) {
      child.disconnect();
    }
  });

  return node;
});
