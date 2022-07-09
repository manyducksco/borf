import { appContextKey } from "../helpers/initComponent.js";
import { isTemplate } from "../helpers/typeChecking.js";

export function Outlet() {
  const $element = this.$attrs.map("element");
  const node = document.createTextNode("");

  const appContext = this[appContextKey];

  let connected = null;

  function swapElement(element) {
    if (connected) {
      connected.disconnect();
      connected = null;
    }

    if (element) {
      if (isTemplate(element)) {
        element = element.init(appContext);
      }

      element.connect(node.parentNode, node);
      connected = element;
    }
  }

  this.watchState($element, swapElement);

  return node;
}
