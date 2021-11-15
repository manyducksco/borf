import { $Node } from "./$Node";

export class $If extends $Node {
  condition;
  component;
  unlisten;

  constructor(value, component) {
    super();
    this.condition = value;
    this.component = component;
  }

  update(value) {
    if (value && this.element?.parentNode) {
      this.component.connect(this.element.parentNode, this.element);
    } else {
      this.component.disconnect();
    }
  }

  beforeConnect() {
    if (!this.unlisten) {
      this.unlisten = this.condition(this.update.bind(this));
    }
  }

  connected() {
    this.update(this.condition());
  }

  disconnected() {
    this.component.disconnect();

    if (this.unlisten) {
      this.unlisten();
      this.unlisten = undefined;
    }
  }
}
