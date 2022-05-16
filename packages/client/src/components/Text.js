import { makeComponent } from "../makeComponent.js";

export const Text = makeComponent((_, self) => {
  const node = document.createTextNode("");

  self.beforeConnect(() => {
    function setText(attrs) {
      node.textContent = attrs.value || attrs.defaultValue || "";
    }

    self.watchState(self.map(), setText, { immediate: true });
  });

  return node;
});
