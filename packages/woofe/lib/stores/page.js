import { Store } from "../classes/Store.js";
import { isString } from "../helpers/typeChecking.js";
import { makeState } from "../makeState.js";

export class PageStore extends Store {
  setup(ctx) {
    const $$title = makeState(document?.title);
    const $$visibility = makeState(document.visibilityState);

    ctx.afterConnect(() => {
      if (document) {
        ctx.observe($$title, (current) => {
          if (isString(current)) {
            document.title = current;
          }
        });

        document.addEventListener("visibilitychange", () => {
          $$visibility.set(document.visibilityState);
        });

        window.addEventListener("focus", () => {
          $$visibility.set("visible");
        });
      }
    });

    return {
      $$title,
      $visibility: $$visibility.readable(),
    };
  }
}
