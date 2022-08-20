import { makeComponent } from "../makeComponent.js";

export const Text = makeComponent((ctx) => {
  const node = document.createTextNode("");

  ctx.subscribeTo(ctx.$attrs, (attrs) => {
    if (attrs.value != null) {
      node.textContent = String(attrs.value);
    } else if (attrs.defaultValue != null) {
      node.textContent = String(attrs.defaultValue);
    } else {
      node.textContent = "";
    }
  });

  return node;
});
