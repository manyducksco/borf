import { APP_CONTEXT, ELEMENT_CONTEXT } from "../keys.js";
import { makeView } from "./makeView.js";
import { toBlueprints } from "./helpers/toBlueprints.js";

/**
 * Displays one or more children without a parent element.
 */
export const Fragment = makeView((ctx) => {
  const appContext = ctx[APP_CONTEXT];
  const elementContext = ctx[ELEMENT_CONTEXT];
  const node = document.createComment("Fragment");

  let connectedViews = [];

  ctx.observe("children", (children) => {
    for (const child of connectedViews) {
      child.disconnect();
    }
    connectedViews = [];

    let after = node;

    const blueprints = toBlueprints(children);

    for (const blueprint of blueprints) {
      const view = blueprint.build({ appContext, elementContext });
      view.connect(node.parentNode, after);
      after = view.node;

      connectedViews.push(view);
    }
  });

  ctx.afterDisconnect(() => {
    for (const child of connectedViews) {
      child.disconnect();
    }
    connectedViews = [];
  });

  return node;
});
