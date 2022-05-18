import { makeComponent } from "../makeComponent.js";

/**
 * Displays a dynamic list based on an array stored in a `$value` attribute.
 */
export const Each = makeComponent(($, self) => {
  self.debug.name = "woof:$:each";

  const $value = self.map("value");
  const initComponent = self.get("component");

  const node = document.createTextNode("");

  let items = [];

  function update(newItems) {
    if (newItems == null) {
      for (const item of items) {
        item.node.disconnect();
      }

      items = [];

      return;
    }

    const newInstances = newItems.map((value, index) =>
      initComponent({
        getService: self.getService,
        dolla: $,
        $route: self.$route,
        debug: self.getService("@debug").makeChannel(`each item ${index}`),
        attrs: {
          "@value": value,
          "@index": index,
        },
      })
    );

    const removed = [];
    const added = [];
    const unchanged = [];

    const newKeys = newInstances.map((item) => item.key);

    for (const item of items) {
      const stillPresent = newKeys.includes(item.key);

      if (!stillPresent) {
        removed.push(item);
      }
    }

    for (const instance of newInstances) {
      const exists = items.find((item) => item.key === instance.key);

      if (!exists) {
        added.push(instance);
      } else {
        unchanged.push(instance);
      }
    }

    for (const instance of removed) {
      instance.disconnect();
      items.splice(items.indexOf(instance), 1);
    }

    for (const instance of unchanged) {
      const newIndex = newInstances.indexOf(instance);
      const previous = newInstances[newIndex - 1];
      const newInstance = newInstances[newIndex];

      const spliced = items.splice(
        items.findIndex((i) => i.key === instance.key),
        1
      );
      items.splice(items.indexOf(previous), 0, ...spliced);
      spliced[0].$attrs.set(newInstance.$attrs.get());
    }

    for (const instance of added) {
      const newIndex = newInstances.indexOf(instance);
      const previous = newInstances[newIndex - 1];

      instance.connect(node.parentNode, previous?.element);
      items.splice(items.indexOf(previous), 0, instance);
    }
  }

  self.connected(() => {
    self.watchState($value, update, { immediate: true });
  });

  self.disconnected(() => {
    for (const item of items) {
      item.disconnect();
    }
    items = [];
  });

  return node;
});