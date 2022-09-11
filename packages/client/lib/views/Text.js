export function Text() {
  const node = document.createTextNode("");

  this.observe((state) => {
    if (state.value != null) {
      node.textContent = String(state.value);
    } else if (state.defaultValue != null) {
      node.textContent = String(state.defaultValue);
    } else {
      node.textContent = "";
    }
  });

  return node;
}
