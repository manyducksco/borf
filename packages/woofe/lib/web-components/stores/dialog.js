import { Store } from "../../core/classes/Store.js";

export class DialogStore extends Store {
  setup(ctx) {
    return {
      makeDialog() {
        ctx.warn("Not yet implemented for web components.");
      },
    };
  }
}