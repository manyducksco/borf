import { isObservable } from "../helpers/typeChecking.js";

export class TextBlueprint {
  constructor(observable, defaultValue) {
    this.observable = observable;
    this.defaultValue = defaultValue;
  }

  get isBlueprint() {
    return true;
  }

  build() {
    return new TextView(this.observable, this.defaultValue);
  }
}

class TextView {
  node = document.createTextNode("");

  constructor(observable, defaultValue) {
    this.observable = observable;
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
      if (isObservable(this.observable)) {
        this.subscription = this.observable.subscribe((value) => {
          this._update(value);
        });
      } else {
        this._update(this.observable);
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
