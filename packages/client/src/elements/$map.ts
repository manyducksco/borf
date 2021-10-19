import { Subscribable, Subscription } from "../types";
import { BaseComponent, Component } from "./BaseComponent";

/**
 * Converts an array of objects into a list of elements. Updates list when array changes.
 *
 * @param array - subscribable list of items
 * @param getKey - function to extract a unique key for each item in the list
 * @param createItem - function to create a component for each element in the list
 */
export const $map = <T>(
  list: Subscribable<T[]>,
  getKey: (item: T) => string | number,
  createItem: (item: T) => Component
) => new MapComponent<T>(list, getKey, createItem);

class MapComponent<T> implements Component {
  private subscription: Subscription<T[]>;
  private state: {
    index: number;
    key: string | number;
    component: Component;
  }[] = [];
  isMounted = false;
  root = document.createTextNode("");

  constructor(
    list: Subscribable<T[]>,
    private getKey: (item: T) => string | number,
    private createItem: (item: T) => Component
  ) {
    this.subscription = list.subscribe();

    this.subscription.receiver.callback = this.update.bind(this);
    this.update(this.subscription.initialValue);
  }

  private update(list: T[]) {
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

    /**
     * Start with     [1, 2, 3, 4, 5]
     * Remove some    [ , 2, 3,  , 5]
     * Leaves with    [2, 3, 5]            // 2: -1,   3: -1,   5: -2
     * With Added     [2, 3, 5, 6, 7]
     *
     * Items that are still there from last update will likely need to be moved in the DOM.
     * They would technically be moved by taking out the removed items. This could be calculated
     * to operate with the fewest possible changes to end up in the new state.
     *
     * If an item is removed, will the item immediately following always have its index adjusted by -1?
     */

    console.log({ keys: newKeys, added, removed, moved });

    // every time the list changes:
    //   - get keys for all items using `getKey`
    //   - remove components with keys that aren't in the new keys list
    //   - create new components for the missing keys
    //   - insert new components to end up with the DOM items in the same order as keys list
  }

  mount(parent: Node, after?: Node) {
    let previous = after;

    for (const item of this.state) {
      item.component.mount(parent, previous);

      if (item.component instanceof BaseComponent) {
        previous = item.component.root;
      }
    }

    this.isMounted = true;
  }

  unmount() {
    for (const item of this.state) {
      item.component.unmount();
    }

    this.isMounted = false;
  }
}
