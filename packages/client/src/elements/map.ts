import { Subscription } from "../State/types";
import { isArray, isSubscription } from "../utils/index";
import { BaseComponent } from "./BaseComponent";

/**
 * Converts an array of objects into a list of elements. Updates list when array changes.
 *
 * @param array - array of items or subscription to an array of items
 * @param key - key property name or a function to extract a key for each item in the list
 * @param create - function to create a component for each element in the list
 */
export const map = <T>(
  array: T[] | Subscription<T[]>,
  key: keyof T | ((item: T) => string | number),
  create: (item: T) => BaseComponent
) => {
  const fragment = new DocumentFragment();
  let components: BaseComponent[] = [];

  function getKey(item: T) {
    if (typeof key === "function") {
      return String(key(item));
    } else {
      return String(item[key]);
    }
  }

  if (isArray<T>(array)) {
    for (const item of array) {
      const component = create(item);
      component.mount(fragment);
    }
  }

  // Diff and update the mapped components when array changes
  if (isSubscription<T[]>(array)) {
    array.receiver.callback = (newValue) => {
      const newKeys = newValue.map(getKey);
      const newComponents = [...components];

      // batch DOM updates
      requestAnimationFrame(() => {
        // remove old components
        newComponents.forEach((component, i) => {
          const match = newKeys.find((key) => component.key === key);

          if (!match) {
            component.unmount();
            newComponents.splice(i, 1);
          }
        });

        // append new components
        newKeys.forEach((key, i) => {
          const match = components.find((c) => c.key === key);

          if (!match) {
            const indexOfPreviousKey = newComponents.findIndex(
              (c) => c.key === newKeys[i - 1]
            );

            const component = create(newValue[i]);
            component.key = key;

            // mount new component at its new index in the list
            component.mount(fragment, newComponents[indexOfPreviousKey].root);

            newComponents.splice(indexOfPreviousKey, 0, component);
          }

          components = newComponents;

          console.log(newComponents);
        });
      });
    };

    // set initial list
    array.receiver.callback(array.current);
  }

  return new BaseComponent(fragment);
};
