import { $Node } from "./$Node";

export class $Map extends $Node {
  source;
  getKey;
  createItem;
  unlisten;
  nodes = [];

  constructor(list, getKey, createItem) {
    super();
    this.source = list;
    this.getKey = getKey;
    this.createItem = createItem;
  }

  update(list) {
    if (!this.isConnected) {
      return;
    }

    const newKeys = list.map(this.getKey);
    const added = [];
    const removed = [];
    const moved = [];

    for (let i = 0; i < newKeys.length; i++) {
      const key = newKeys[i];
      const tracked = this.nodes.find((item) => item.key === key);

      if (tracked) {
        if (tracked.index !== i) {
          moved.push({
            from: tracked.index,
            to: i,
            key,
          });
        }
      } else {
        added.push({ i, key });
      }
    }

    for (const tracked of this.nodes) {
      const stillPresent = newKeys.includes(tracked.key);

      if (!stillPresent) {
        removed.push({ i: tracked.index, key: tracked.key });
      }
    }

    // Determine what the next state is going to be, reusing components when possible.
    const newNodes = [];

    for (let i = 0; i < list.length; i++) {
      const key = newKeys[i];
      const isAdded = added.some((x) => x.key === key);
      let component;

      if (isAdded) {
        component = this.createItem(list[i]);
      } else {
        component = this.nodes.find((x) => x.key === key).component;
      }

      newNodes.push({
        index: i,
        key,
        component,
      });
    }

    // Batch all changes into an animation frame
    requestAnimationFrame(() => {
      // Unmount removed components
      for (const entry of removed) {
        const item = this.nodes.find((x) => x.key === entry.key);

        item?.component.disconnect();
      }

      const fragment = new DocumentFragment();

      // Remount components in new order
      let previous = undefined;
      for (const item of newNodes) {
        item.component.connect(fragment, previous);

        if (item.component.hasOwnProperty("root")) {
          previous = item.component.element;
        }
      }

      this.element.parentNode.insertBefore(fragment, this.element.nextSibling);

      this.nodes = newNodes;
    });
  }

  beforeConnect() {
    if (!this.unlisten) {
      this.unlisten = this.source(this.update.bind(this));
    }
  }

  connected() {
    this.update(this.source());
  }

  disconnected() {
    for (const item of this.nodes) {
      item.component.disconnect();
    }

    if (this.unlisten) {
      this.unlisten();
      this.unlisten = undefined;
    }
  }
}
