import { makeComponent } from "../makeComponent.js";

export const Text = makeComponent((_, self) => {
  const node = document.createTextNode("");

  self.beforeConnect(() => {
    function setText(attrs) {
      if (attrs.value != null) {
        node.textContent = String(attrs.value);
      } else if (attrs.defaultValue != null) {
        node.textContent = String(attrs.defaultValue);
      } else {
        node.textContent = "";
      }
    }

    self.watchState(self.map(), setText, { immediate: true });
  });

  return node;
});
