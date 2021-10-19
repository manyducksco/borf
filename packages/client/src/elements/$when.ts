import { Subscribable, Subscription } from "../types";
import { Component } from "./BaseComponent";

/**
 * Mounts a component when a condition is true and unmounts it when the condition is false.
 *
 * @param condition - value or a subscription to a value
 * @param component - component to display
 */
export const $when = (condition: Subscribable<boolean>, component: Component) =>
  new WhenComponent(condition, component);

export class WhenComponent implements Component {
  private node = document.createTextNode("");
  private component: Component;
  private subscription: Subscription<boolean>;

  private parent?: Node;
  private after?: Node;

  get root() {
    return this.node;
  }

  get isMounted() {
    return this.parent != null;
  }

  constructor(condition: Subscribable<boolean>, component: Component) {
    this.subscription = condition.subscribe();
    this.component = component;

    this.subscription.receiver.callback = (newValue) => {
      if (newValue && this.parent) {
        if (this.node.parentNode) {
          this.parent?.removeChild(this.node);
        }

        this.component.mount(this.parent, this.after);
      } else {
        this.parent?.insertBefore(this.node, this.component.root);
        this.component.unmount();
      }
    };

    this.subscription.receiver.callback(this.subscription.initialValue);
  }

  mount(parent: Node, after?: Node) {
    this.parent = parent;
    this.after = after;
  }

  unmount() {
    this.component.unmount();
    if (this.node.parentNode) {
      this.parent?.removeChild(this.node);
    }

    this.parent = undefined;
    this.after = undefined;
  }
}
