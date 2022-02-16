import { makeComponent } from "../../makeComponent.js";

export const Text = makeComponent((_, self) => {
  const node = document.createTextNode("");

  self.beforeConnect(() => {
    function setText(attrs) {
      // TODO: Batch DOM writes
      node.textContent = attrs.value || attrs.defaultValue || "";
    }

    self.watchState(self.$attrs, setText, { immediate: true });
  });

  return node;
});
