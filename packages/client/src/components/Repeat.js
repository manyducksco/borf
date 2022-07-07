import { appContextKey, initComponent } from "../helpers/initComponent.js";
import { isArray } from "../helpers/typeChecking.js";

/**
 * Displays a dynamic list based on an array stored in a `value` attribute.
 */
export function Repeat(self) {
  self.debug.name = "woof:template:repeat";

  const { $attrs } = self;

  const appContext = self[appContextKey];
  const $value = $attrs.map("value");
  const componentFn = $attrs.get("component");
  const getKey = $attrs.get("getKey") || ((value) => value);

  const node = document.createTextNode("");

  let connectedItems = [];

  function update(newValues) {
    if (!isArray(newValues)) {
      throw new TypeError(
        `Repeat expects an array or a state containing an array. Got: ${newValues} (${typeof newValues})`
      );
    }

    // Disconnect all if updated with empty values.
    if (newValues == null) {
      for (const item of connectedItems) {
        item.component.disconnect();
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

    // Disconnect components for items that no longer exist.
    for (const item of connectedItems) {
      const stillPresent = !!newKeys.find((key) => key.value === item.key);

      if (!stillPresent) {
        item.component.disconnect();
      }
    }

    // Add new components and update props for existing ones.
    for (const key of newKeys) {
      const existing = connectedItems.find((item) => item.key === key.value);

      if (existing) {
        existing.component.$attrs.set(key.attrs);
        newItems[key.index] = existing;
      } else {
        newItems[key.index] = {
          key: key.value,
          component: initComponent(appContext, componentFn, key.attrs),
        };
      }
    }

    // Reconnect to ensure order. Lifecycle hooks won't be run again if the component is already connected.
    for (const item of newItems) {
      item.component.connect(node.parentNode);
    }

    connectedItems = newItems;
  }

  self.watchState($value, update);

  self.afterDisconnect(() => {
    for (const item of connectedItems) {
      item.component.disconnect();
    }
    connectedItems = [];
  });

  return node;
}
