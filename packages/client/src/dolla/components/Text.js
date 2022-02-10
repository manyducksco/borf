import { makeComponent } from "../../makeComponent.js";

export const Text = makeComponent((_, self) => {
  const node = document.createTextNode("");

  function setText(attrs) {
    node.textContent = attrs.value || attrs.defaultValue || "";
  }

  self.beforeConnect(() => {
    self.watchState(self.$attrs, setText, { immediate: true });
  });

  return node;
});
