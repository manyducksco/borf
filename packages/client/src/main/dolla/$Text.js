import { $Node } from "./$Node";
import { isState } from "../../_helpers/typeChecking";

export class $Text extends $Node {
  constructor(value) {
    super();

    if (isState(value)) {
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
      this.unwatch = this.state.watch((value) => {
        this.value = value;
        this.$element.textContent = value;
      });

      this.value = this.state.get();
      this.$element.textContent = this.value;
    }
  }

  _disconnected() {
    if (this.unwatch) {
      this.unwatch();
      this.unwatch = null;
    }
  }
}
