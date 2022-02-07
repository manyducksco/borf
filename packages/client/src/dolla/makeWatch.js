import { isState, makeState } from "@woofjs/state";
import { makeNode } from "./makeNode.js";
import { makeRenderable } from "./makeRenderable.js";

/**
 * Recreates its contents each time $state changes.
 */
export const makeWatch = makeNode((self, $state, makeItem) => {
  if (!isState($state)) {
    $state = makeState($state);
  }

  let unwatch;
  let item;

  function update(value) {
    if (!self.isConnected) {
      return;
    }

    let newElement = makeItem(value);

    if (newElement != null) {
      newElement = makeRenderable(newElement)();
    }

    requestAnimationFrame(() => {
      if (!self.isConnected) {
        return;
      }

      if (item) {
        item.disconnect();
        item = null;
      }

      if (newElement) {
        item = newElement;
        item.connect(self.element.parentNode, self.element);
      }
    });
  }

  self.connected(() => {
    if (!unwatch) {
      unwatch = $state.watch(update);
    }

    update($state.get());
  });

  self.disconnected(() => {
    if (item) {
      item.disconnect();
      item = null;
    }

    if (unwatch) {
      unwatch();
      unwatch = undefined;
    }
  });

  return document.createTextNode("");
});
