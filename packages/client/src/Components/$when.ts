import { Listenable } from "../Source";
import { Component } from "./Component";

/**
 * Mounts a component when a condition is true and unmounts it when the condition is false.
 *
 * @param condition - value or a subscription to a value
 * @param component - component to display
 */
export const $when = (condition: Listenable<boolean>, component: Component) =>
  new WhenComponent(condition, component);

export class WhenComponent extends Component {
  private unlisten?: () => void;

  constructor(
    private condition: Listenable<boolean>,
    private component: Component
  ) {
    super();
  }

  private update(value: boolean) {
    if (value && this.element?.parentNode) {
      this.component.connect(this.element.parentNode, this.element);
    } else {
      this.component.disconnect();
    }
  }

  beforeConnect() {
    if (!this.unlisten) {
      this.unlisten = this.condition.listen(this.update.bind(this));
    }
  }

  connected() {
    this.update(this.condition.current);
  }

  disconnected() {
    this.component.disconnect();

    if (this.unlisten) {
      this.unlisten();
      this.unlisten = undefined;
    }
  }
}
