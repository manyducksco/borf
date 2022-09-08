export function Text() {
  const node = document.createTextNode("");

  this.subscribeTo(this.$attrs, (attrs) => {
    if (attrs.value != null) {
      node.textContent = String(attrs.value);
    } else if (attrs.defaultValue != null) {
      node.textContent = String(attrs.defaultValue);
    } else {
      node.textContent = "";
    }
  });

  return node;
}
