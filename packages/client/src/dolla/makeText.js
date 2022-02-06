import { isState, makeState } from "@woofjs/state";
import { makeNode } from "./makeNode.js";

export const makeText = makeNode((self, value, defaultValue) => {
  let $state;
  let unwatch;

  if (isState(value)) {
    $state = value;
  } else {
    $state = makeState(value);
  }

  self.beforeConnect(() => {
    unwatch = $state.watch((value) => {
      if (value) {
        self.element.textContent = value;
      } else {
        self.element.textContent = defaultValue || "";
      }
    });
  });

  self.disconnected(() => {
    unwatch();
  });

  return document.createTextNode($state.get());
});
