/**
 * Displays one or more children without a parent element.
 */
export function Fragment() {
  const node = document.createComment("fragment");

  this.afterConnect(() => {
    let after = node;

    for (const child of this.children) {
      child.connect(node.parentNode, after);
      after = child.node;
    }
  });

  this.afterDisconnect(() => {
    for (const child of this.children) {
      child.disconnect();
    }
  });

  return node;
}
