import { makeComponent } from "../makeComponent.js";

/**
 * Displays one or more children without a parent element.
 */
export const Fragment = makeComponent((ctx) => {
  const node = document.createComment("fragment");

  ctx.afterConnect(() => {
    let after = node;

    for (const child of ctx.children) {
      child.connect(node.parentNode, after);
      after = child.node;
    }
  });

  ctx.afterDisconnect(() => {
    for (const child of ctx.children) {
      child.disconnect({ allowTransitionOut: true });
    }
  });

  return node;
});
