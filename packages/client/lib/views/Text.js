import { makeView } from "../makeView.js";

export const Text = makeView((ctx) => {
  const node = document.createTextNode("");

  ctx.observe((state) => {
    if (state.value != null) {
      node.textContent = String(state.value);
    } else if (state.defaultValue != null) {
      node.textContent = String(state.defaultValue);
    } else {
      node.textContent = "";
    }
  });

  return node;
});
