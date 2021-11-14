import { $Node } from "./$Node";

export class $Route extends $Node {
  createElement() {
    return document.createElement("div");
  }
}
