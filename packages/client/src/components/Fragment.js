/**
 * Displays one or more children without a parent element.
 */
export function Fragment(self) {
  const node = document.createTextNode("");

  self.afterConnect(() => {
    let after = node;

    for (const child of self.children) {
      child.connect(node.parentNode, after);
      after = child.node;
    }
  });

  self.afterDisconnect(() => {
    for (const child of self.children) {
      child.disconnect();
    }
  });

  return node;
}
