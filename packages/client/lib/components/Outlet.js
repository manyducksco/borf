import { isTemplate } from "../helpers/typeChecking.js";
import { $$appContext, $$elementContext } from "../keys.js";

export function Outlet() {
  const $element = this.$attrs.map((a) => a.element);
  const node = document.createComment("outlet");

  const appContext = this[$$appContext];
  const elementContext = this[$$elementContext];

  let connected = null;

  this.subscribeTo($element, (element) => {
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
}
