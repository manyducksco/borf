import { isTemplate } from "../helpers/typeChecking.js";
import { APP_CONTEXT, ELEMENT_CONTEXT } from "../keys.js";

export function Outlet() {
  const node = document.createComment("Outlet");

  const appContext = this[APP_CONTEXT];
  const elementContext = this[ELEMENT_CONTEXT];

  let connected = null;

  this.observe("element", (element) => {
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
