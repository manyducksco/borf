export function Text() {
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

  this.subscribeTo(this.$attrs, setText);

  return node;
}
