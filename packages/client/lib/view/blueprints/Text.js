import { isFunction } from "../../helpers/typeChecking.js";

export class TextBlueprint {
  constructor(binding, defaultValue) {
    this.binding = binding;
    this.defaultValue = defaultValue;
  }

  get isBlueprint() {
    return true;
  }

  build() {
    return new TextView(this.binding, this.defaultValue);
  }
}

class TextView {
  node = document.createTextNode("");

  constructor(binding, defaultValue) {
    this.binding = binding;
    this.defaultValue = defaultValue;
  }

  get isView() {
    return true;
  }

  get isConnected() {
    return this.node.parentNode != null;
  }

  _update(value) {
    if (value != null) {
      this.node.textContent = String(value);
    } else if (this.defaultValue != null) {
      this.node.textContent = String(this.defaultValue);
    } else {
      this.node.textContent = "";
    }
  }

  connect(parent, after = null) {
    if (!this.isConnected) {
      if (isFunction(this.binding.subscribe)) {
        this.subscription = this.binding.subscribe((value) => {
          this._update(value);
        });
      } else {
        this._update(this.binding);
      }

      parent.insertBefore(this.node, after?.nextSibling);
    }
  }

  disconnect() {
    if (this.isConnected) {
      if (this.subscription) {
        this.subscription.unsubscribe();
      }

      this.node.parentNode.removeChild(this.node);
    }
  }
}
