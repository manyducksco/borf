import { $Node } from "./$Node";
import { isFunction } from "../_helpers/typeChecking";

export class $Text extends $Node {
  constructor(value) {
    super();

    if (isFunction(value)) {
      this.state = value;
    } else {
      this.value = value;
    }
  }

  createElement() {
    return document.createTextNode(this.value);
  }

  _beforeConnect() {
    if (this.state) {
      this.cancel = this.state((value) => {
        this.value = value;
        this.$element.textContent = value;
      });

      this.value = this.state();
      this.$element.textContent = this.value;
    }
  }

  _disconnected() {
    if (this.cancel) {
      this.cancel();
      this.cancel = null;
    }
  }
}
