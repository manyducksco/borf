import { appContextKey, elementContextKey } from "../helpers/initComponent.js";
import { isTemplate } from "../helpers/typeChecking.js";

export function Outlet() {
  const $element = this.$attrs.map("element");
  const node = document.createComment("outlet");

  const appContext = this[appContextKey];
  const elementContext = this[elementContextKey];

  let connected = null;

  function swapElement(element) {
    if (connected) {
      connected.disconnect({ allowTransitionOut: true });
      connected = null;
    }

    if (element) {
      if (isTemplate(element)) {
        element = element.init(appContext, elementContext);
      }

      element.connect(node.parentNode, node);
      connected = element;
    }
  }

  this.subscribeTo($element, swapElement);

  return node;
}
