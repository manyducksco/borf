import { Type } from "@borf/bedrock";
import { Store } from "../classes/Store.js";
import { State } from "../classes/State.js";

export const PageStore = Store.define({
  label: "page",
  setup(ctx) {
    const $$title = new State(document?.title);
    const $$visibility = new State(document.visibilityState);
    const $$orientation = new State();
    const $$colorScheme = new State();

    /* ----- Title and Visibility ----- */

    if (document) {
      ctx.subscribe($$title, (current) => {
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

    // Read initial orientation.
    onOrientationChange(landscapeQuery);

    /* ----- Color Scheme ----- */

    const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function onColorChange(e) {
      $$colorScheme.set(e.matches ? "dark" : "light");
    }

    // Read initial color scheme.
    onColorChange(colorSchemeQuery);

    /* ----- Lifecycle ----- */

    // Listen for changes while connected.
    ctx.onConnect(() => {
      landscapeQuery.addEventListener("change", onOrientationChange);
      colorSchemeQuery.addEventListener("change", onColorChange);
    });
    ctx.onDisconnect(() => {
      landscapeQuery.removeEventListener("change", onOrientationChange);
      colorSchemeQuery.removeEventListener("change", onColorChange);
    });

    /* ----- Exports ----- */

    return {
      $$title,
      $visibility: $$visibility.readable(),
      $orientation: $$orientation.readable(),
      $colorScheme: $$colorScheme.readable(),
    };
  },
});
