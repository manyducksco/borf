import { makeComponent } from "../makeComponent.js";
import { isTemplate } from "../helpers/typeChecking.js";
import { $$appContext, $$elementContext } from "../keys.js";

export const Outlet = makeComponent((ctx) => {
  const $element = ctx.$attrs.map((a) => a.element);
  const node = document.createComment("outlet");

  const appContext = ctx[$$appContext];
  const elementContext = ctx[$$elementContext];

  let connected = null;

  ctx.subscribeTo($element, (element) => {
    if (connected) {
      connected.disconnect({ allowTransitionOut: true });
      connected = null;
    }

    if (element) {
      if (isTemplate(element)) {
        element = element.init({ appContext, elementContext });
      }

      element.connect(node.parentNode, node);
      connected = element;
    }
  });

  return node;
});
