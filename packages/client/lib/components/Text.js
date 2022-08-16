import { makeComponent } from "../makeComponent.js";

export const Text = makeComponent((ctx) => {
  const node = document.createTextNode("");

  function setText(attrs) {
    if (attrs.value != null) {
      node.textContent = String(attrs.value);
    } else if (attrs.defaultValue != null) {
      node.textContent = String(attrs.defaultValue);
    } else {
      node.textContent = "";
    }
  }

  ctx.subscribeTo(ctx.$attrs, setText);

  return node;
});
