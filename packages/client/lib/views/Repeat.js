import { makeView } from "../makers/makeView.js";
import { isArray } from "../helpers/typeChecking.js";
import { APP_CONTEXT } from "../keys.js";

/**
 * Displays a dynamic list based on an array stored in a `value` attribute.
 */
export function Repeat() {
  this.name = "repeat";
  this.defaultState = {
    value: [],
    view: null,
    getKey: null,
  };

  const node = document.createComment("woof:repeat");

  const appContext = this[APP_CONTEXT];
  const viewFn = this.get("view");
  const getKey = this.get("getKey") || ((v) => v);

  let connectedItems = [];

  this.observe("value", (newValues) => {
    if (!isArray(newValues)) {
      throw new TypeError(`Repeat expects an array. Got: ${typeof newValues}`);
    }

    // Disconnect all if updated with empty values.
    if (newValues == null) {
      for (const item of connectedItems) {
        item.view.disconnect({ allowTransitionOut: true });
      }
      connectedItems = [];

      return;
    }

    const newKeys = newValues.map((value, index) => {
      return {
        value: getKey(value, index),
        index,
        attrs: {
          value,
          index,
        },
      };
    });
    const newItems = [];

    // Disconnect views for items that no longer exist.
    for (const item of connectedItems) {
      const stillPresent = !!newKeys.find((key) => key.value === item.key);

      if (!stillPresent) {
        item.view.disconnect({ allowTransitionOut: true });
      }
    }

    // Add new views and update state for existing ones.
    for (const key of newKeys) {
      const existing = connectedItems.find((item) => item.key === key.value);

      if (existing) {
        existing.view.state.set(key.attrs);
        newItems[key.index] = existing;
      } else {
        newItems[key.index] = {
          key: key.value,
          view: makeView(viewFn, { attrs: key.attrs, appContext }),
        };
      }
    }

    // Reconnect to ensure order. Lifecycle hooks won't be run again if the view is already connected.
    for (const item of newItems) {
      item.view.connect(node.parentNode);
    }

    connectedItems = newItems;
  });

  this.afterDisconnect(() => {
    for (const item of connectedItems) {
      item.view.disconnect();
    }
    connectedItems = [];
  });

  return node;
}
