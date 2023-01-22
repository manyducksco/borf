import { omit } from "../helpers/omit.js";
import { Connectable } from "./Connectable.js";

export class Local extends Connectable {
  #node;
  #appContext;
  #elementContext;
  #lifecycleCallbacks = {
    beforeConnect: [],
    afterConnect: [],
    beforeDisconnect: [],
    afterDisconnect: [],
  };
  #activeSubscriptions = [];

  get node() {
    return this.#node;
  }

  constructor(config) {
    this.#node = document.createComment(` Local: ${config.attributes.name} `);
  }
}
