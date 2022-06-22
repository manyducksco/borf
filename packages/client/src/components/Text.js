export function Text($attrs, self) {
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

  self.watchState($attrs, setText);

  return node;
}
