import { $Node } from "./$Node";

export class $Fragment extends $Node {
  children;

  constructor(children) {
    super();

    this.children = children;
  }

  createElement() {
    return document.createTextNode("");
  }

  _connected() {
    let after = this.$element;

    for (const child of this.children) {
      child.$connect(this.$element.parentNode, after);
      after = child.$element;
    }
  }

  _disconnected() {
    for (const child of this.children) {
      child.$disconnect();
    }
  }
}
