import { Type } from "@frameworke/bedrocke";
import { Store } from "../classes/Store.js";
import { State } from "../classes/State.js";

export const DocumentStore = Store.define({
  label: "document",
  setup(ctx) {
    const $$title = new State(document?.title);
    const $$visibility = new State(document.visibilityState);
    const $$orientation = new State();

    /* ----- Title and Visibility ----- */

    if (document) {
      ctx.observe($$title, (current) => {
        if (Type.isString(current)) {
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
    ctx.onConnect(() => {
      landscapeQuery.addEventListener("change", onOrientationChange);
    });
    ctx.onDisconnect(() => {
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
  },
});
