import { type ComponentContext } from "../component.js";
import { Writable } from "../state.js";

type ScreenOrientation = "landscape" | "portrait";
type ColorScheme = "light" | "dark";

export function DocumentStore(_: {}, ctx: ComponentContext) {
  ctx.name = "borf/document";

  const $$title = new Writable(document.title);
  const $$visibility = new Writable(document.visibilityState);
  const $$orientation = new Writable<ScreenOrientation>("landscape");
  const $$colorScheme = new Writable<ColorScheme>("light");

  /* ----- Title and Visibility ----- */

  ctx.observe($$title, (current) => {
    document.title = current;
  });

  const onVisibilityChange = () => {
    $$visibility.value = document.visibilityState;
  };

  const onFocus = () => {
    $$visibility.value = "visible";
  };

  /* ----- Orientation ----- */

  const landscapeQuery = window.matchMedia("(orientation: landscape)");

  function onOrientationChange(e: MediaQueryList | MediaQueryListEvent) {
    $$orientation.value = e.matches ? "landscape" : "portrait";
  }

  // Read initial orientation.
  onOrientationChange(landscapeQuery);

  /* ----- Color Scheme ----- */

  const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function onColorChange(e: MediaQueryList | MediaQueryListEvent) {
    $$colorScheme.value = e.matches ? "dark" : "light";
  }

  // Read initial color scheme.
  onColorChange(colorSchemeQuery);

  /* ----- Lifecycle ----- */

  // Listen for changes while connected.
  ctx.onConnected(function () {
    landscapeQuery.addEventListener("change", onOrientationChange);
    colorSchemeQuery.addEventListener("change", onColorChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);
  });
  ctx.onDisconnected(function () {
    landscapeQuery.removeEventListener("change", onOrientationChange);
    colorSchemeQuery.removeEventListener("change", onColorChange);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("focus", onFocus);
  });

  /* ----- Exports ----- */

  return {
    $$title,
    $visibility: $$visibility.toReadable(),
    $orientation: $$orientation.toReadable(),
    $colorScheme: $$colorScheme.toReadable(),
  };
}
