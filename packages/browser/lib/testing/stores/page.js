import { makeState } from "../../core/makeState.js";
import { Store } from "../../core/classes/Store.js";

export class MockPageStore extends Store {
  static label = "mock:page";

  setup(ctx) {
    return {
      $$title: makeState("Test"),
      $visibility: makeState("visible").readable(),
    };
  }
}
