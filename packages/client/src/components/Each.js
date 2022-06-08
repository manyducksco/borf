import { makeComponent } from "../makeComponent.js";

/**
 * Displays a dynamic list based on an array stored in a `value` attribute.
 */
export const Each = makeComponent(($, self) => {
  self.debug.name = "woof:$:each";

  const $value = self.$attrs.map("value");
  const initComponent = self.$attrs.get("component");

  const node = document.createTextNode("");

  let items = [];

  function update(newValues) {
    // Disconnect all if updated with empty values.
    if (newValues == null) {
      for (const item of items) {
        item.node.disconnect();
      }
      items = [];

      return;
    }

    // Create new components for each item.
    const newComponents = newValues.map((value, index) => {
      const component = initComponent({
        getService: self.getService,
        dolla: $,
        $route: self.$route,
        debug: self.getService("@debug").makeChannel(`each item ${index}`),
        attrs: {
          "@value": value,
          "@index": index,
        },
      });

      if (component.key == null) {
        self.debug.warn(`Components in $.each need a unique self.key. Got: ${component.key}`);
      }

      return component;
    });

    const newKeys = newComponents.map((component) => component.key);
    const newItems = [];

    // Disconnect components for items that no longer exist.
    for (const item of items) {
      const stillPresent = newKeys.includes(item.key);

      if (!stillPresent) {
        component.disconnect();
      }
    }

    // Add new components and update props for existing ones.
    for (let newIndex = 0; newIndex < newComponents.length; newIndex++) {
      const component = newComponents[newIndex];
      const existing = items.find((item) => item.key === component.key);

      if (!existing) {
        newItems[newIndex] = component;
      } else {
        existing.$attrs.set(component.$attrs.get());
        newItems[newIndex] = existing;
      }
    }

    // Reconnect to ensure order. Lifecycle hooks won't be run again if the component is already connected.
    for (const component of newItems) {
      component.connect(node.parentNode);
    }

    items = newItems;
  }

  self.watchState($value, update, { immediate: true });

  self.afterDisconnect(() => {
    for (const item of items) {
      item.disconnect();
    }
    items = [];
  });

  return node;
});
