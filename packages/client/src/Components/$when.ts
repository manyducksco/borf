import { Subscribable, Subscription } from "../types";
import { Component } from "./Component";

/**
 * Mounts a component when a condition is true and unmounts it when the condition is false.
 *
 * @param condition - value or a subscription to a value
 * @param component - component to display
 */
export const $when = (condition: Subscribable<boolean>, component: Component) =>
  new WhenComponent(condition, component);

export class WhenComponent extends Component {
  private subscription?: Subscription<boolean>;
  private currentValue = false;

  constructor(
    private condition: Subscribable<boolean>,
    private component: Component
  ) {
    super(document.createTextNode(""));
  }

  beforeConnect() {
    this.subscription = this.condition.subscribe();

    this.subscription.receiver.callback = (value) => {
      this.currentValue = value;

      if (value && this.root.parentNode) {
        this.component.connect(this.root.parentNode, this.root);
      } else {
        this.component.disconnect();
      }
    };

    this.subscription.receiver.callback(this.subscription.initialValue);
  }

  disconnected() {
    this.component.disconnect();
  }
}
