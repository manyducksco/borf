import { isTemplate } from "../helpers/typeChecking.js";

export function Outlet($attrs, self) {
  const $element = $attrs.map("element");
  const node = document.createTextNode("");

  let connected = null;

  function swapElement(element) {
    if (connected) {
      connected.disconnect();
      connected = null;
    }

    if (element) {
      if (isTemplate(element)) {
        element = element.init(self.getService("@app"));
      }

      element.connect(node.parentNode, node);
      connected = element;
    }
  }

  self.watchState($element, swapElement, { immediate: true });

  return node;
}
