import { Store } from "../classes/Store.js";
import { isString } from "../helpers/typeChecking.js";
import { makeState } from "../makeState.js";

export class PageStore extends Store {
  static inputs = {};

  setup(ctx) {
    const $$title = makeState(document?.title);
    const $$visibility = makeState(document.visibilityState);
    const $$orientation = makeState();

    /* ----- Title and Visibility ----- */

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

    /* ----- Orientation ----- */

    const landscapeQuery = window.matchMedia("(orientation: landscape)");

    function onOrientationChange(e) {
      $$orientation.set(e.matches ? "landscape" : "portrait");
    }

    // Listen for changes while connected.
    ctx.afterConnect(() => {
      landscapeQuery.addEventListener("change", onOrientationChange);
    });
    ctx.afterDisconnect(() => {
      landscapeQuery.removeEventListener("change", onOrientationChange);
    });

    // Read initial orientation.
    onOrientationChange(landscapeQuery);

    /* ----- Exports ----- */

    return {
      $$title,
      $visibility: $$visibility.readable(),
      $orientation: $$orientation.readable(),
    };
  }
}
