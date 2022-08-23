import { makeComponent } from "../makeComponent.js";
import { initComponent } from "../helpers/initComponent.js";
import { isArray } from "../helpers/typeChecking.js";
import { $$appContext } from "../keys.js";

/**
 * Displays a dynamic list based on an array stored in a `value` attribute.
 */
export const Repeat = makeComponent((ctx) => {
  ctx.debug.name = "woof:template:repeat";

  const appContext = ctx[$$appContext];
  const $value = ctx.$attrs.map((a) => a.value);
  const componentFn = ctx.$attrs.get((a) => a.component);
  const getKey = ctx.$attrs.get((a) => a.getKey) || ((value) => value);

  const node = document.createComment("repeat");

  let connectedItems = [];

  ctx.subscribeTo($value, (newValues) => {
    if (!isArray(newValues)) {
      throw new TypeError(
        `Repeat expects an array or a state containing an array. Got: ${newValues} (${typeof newValues})`
      );
    }

    // Disconnect all if updated with empty values.
    if (newValues == null) {
      for (const item of connectedItems) {
        item.component.disconnect({ allowTransitionOut: true });
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
        item.component.disconnect({ allowTransitionOut: true });
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
          component: initComponent(componentFn, { attrs: key.attrs, appContext }),
        };
      }
    }

    // Reconnect to ensure order. Lifecycle hooks won't be run again if the component is already connected.
    for (const item of newItems) {
      item.component.connect(node.parentNode);
    }

    connectedItems = newItems;
  });

  ctx.afterDisconnect(() => {
    for (const item of connectedItems) {
      item.component.disconnect();
    }
    connectedItems = [];
  });

  return node;
});
