import { Listenable } from "../Source";
import { Component } from "./Component";

type MapStateItem = {
  index: number;
  key: string | number;
  component: Component;
};

/**
 * Converts an array of objects into a list of elements, updating dynamically when the array changes.
 *
 * @param array - subscribable list of items
 * @param getKey - function to extract a unique key for each item in the list
 * @param createItem - function to create a component for each element in the list
 */
export const $map = <T>(
  list: Listenable<T[]>,
  getKey: (item: T) => string | number,
  createItem: (item: T) => Component
) => new MapComponent<T>(list, getKey, createItem);

class MapComponent<T> extends Component {
  declare element: Text;
  private source: Listenable<T[]>;
  private unlisten?: () => void;
  private state: MapStateItem[] = [];

  constructor(
    list: Listenable<T[]>,
    private getKey: (item: T) => string | number,
    private createItem: (item: T) => Component
  ) {
    super();
    this.source = list;
  }

  private update(list: T[]) {
    if (!this.isConnected) {
      return;
    }

    const newKeys = list.map(this.getKey);
    const added: { i: number; key: string | number }[] = [];
    const removed: { i: number; key: string | number }[] = [];
    const moved: { from: number; to: number; key: string | number }[] = [];

    for (let i = 0; i < newKeys.length; i++) {
      const key = newKeys[i];
      const tracked = this.state.find((item) => item.key === key);

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

    for (const tracked of this.state) {
      const stillPresent = newKeys.includes(tracked.key);

      if (!stillPresent) {
        removed.push({ i: tracked.index, key: tracked.key });
      }
    }

    // Determine what the next state is going to be, reusing components when possible.
    const newState: MapStateItem[] = [];

    for (let i = 0; i < list.length; i++) {
      const key = newKeys[i];
      const isAdded = added.some((x) => x.key === key);
      let component: Component;

      if (isAdded) {
        component = this.createItem(list[i]);
      } else {
        component = this.state.find((x) => x.key === key)!.component;
      }

      newState.push({
        index: i,
        key,
        component,
      });
    }

    // Batch all changes into an animation frame
    requestAnimationFrame(() => {
      // Unmount removed components
      for (const entry of removed) {
        const item = this.state.find((x) => x.key === entry.key);

        item?.component.disconnect();
      }

      const fragment = new DocumentFragment();

      // Remount components in new order
      let previous: Node | undefined = undefined;
      for (const item of newState) {
        item.component.connect(fragment, previous);

        if (item.component.hasOwnProperty("root")) {
          previous = item.component.element;
        }
      }

      this.element.parentNode!.insertBefore(fragment, this.element.nextSibling);

      this.state = newState;
    });
  }

  beforeConnect() {
    if (!this.unlisten) {
      this.unlisten = this.source.listen(this.update.bind(this));
    }
  }

  connected() {
    this.update(this.source.current);
  }

  disconnected() {
    for (const item of this.state) {
      item.component.disconnect();
    }

    if (this.unlisten) {
      this.unlisten();
      this.unlisten = undefined;
    }
  }
}
