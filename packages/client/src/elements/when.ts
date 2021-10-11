import { Subscription } from "../types.js";
import { isSubscription } from "../utils/index.js";
import { BaseComponent } from "./BaseComponent.js";

/**
 * Mounts a component when a condition is true and unmounts it when the condition is false.
 *
 * @param condition - value or a subscription to a value
 * @param component - component to display
 */
export const when = (
  condition: unknown | Subscription<unknown>,
  component: BaseComponent
) => {
  if (isSubscription<unknown>(condition)) {
    const fragment = new DocumentFragment();

    condition.receiver = (newValue) => {
      if (newValue) {
        component.mount(fragment);
      } else {
        component.unmount();
      }
    };

    // set initial mount status
    condition.receiver(condition.current);

    return new BaseComponent(fragment);
  }

  // just return the component if the static value is truthy
  if (condition) {
    return component;
  }
};
