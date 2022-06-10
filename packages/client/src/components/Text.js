import { makeComponent } from "../makeComponent.js";

export function Text(self) {
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

  self.watchState(self.$attrs, setText, { immediate: true });

  return node;
}

// export const Text = makeComponent((_, self) => {
//   const node = document.createTextNode("");

//   function setText(attrs) {
//     if (attrs.value != null) {
//       node.textContent = String(attrs.value);
//     } else if (attrs.defaultValue != null) {
//       node.textContent = String(attrs.defaultValue);
//     } else {
//       node.textContent = "";
//     }
//   }

//   self.watchState(self.$attrs, setText, { immediate: true });

//   return node;
// });
