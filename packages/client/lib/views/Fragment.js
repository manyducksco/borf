import { isView, isString, isNumber, isObservable, isTemplate } from "../helpers/typeChecking.js";
import { APP_CONTEXT, ELEMENT_CONTEXT } from "../keys.js";
import { initView } from "../makers/initView.js";
import { makeView } from "../makers/makeView.js";

import { Text } from "./Text.js";

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

    for (let child of children) {
      if (isTemplate(child)) {
        child = child.init({ appContext, elementContext });
      } else if (isString(child) || isNumber(child) || isObservable(child)) {
        child = initView(Text, {
          attrs: {
            value: child,
          },
          appContext,
        });
      }

      if (!isView(child)) {
        throw new TypeError(`Children must be components, strings, numbers or observables. Got: ${child}`);
      }

      child.connect(node.parentNode, after);
      after = child.node;

      connectedViews.push(child);
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
