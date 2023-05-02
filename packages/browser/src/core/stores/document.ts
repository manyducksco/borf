import { useConnected, useDisconnected, useName, useObserver } from "../hooks/index.js";
import { Writable } from "../classes/Writable.js";

type ScreenOrientation = "landscape" | "portrait";
type ColorScheme = "light" | "dark";

export function DocumentStore() {
  useName("borf:page");

  const $$title = new Writable(document.title);
  const $$visibility = new Writable(document.visibilityState);
  const $$orientation = new Writable<ScreenOrientation>("landscape");
  const $$colorScheme = new Writable<ColorScheme>("light");

  /* ----- Title and Visibility ----- */

  if (document) {
    useObserver($$title, (current) => {
      document.title = current;
    });

    document.addEventListener("visibilitychange", () => {
      $$visibility.value = document.visibilityState;
    });

    window.addEventListener("focus", () => {
      $$visibility.value = "visible";
    });
  }

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
  useConnected(function () {
    landscapeQuery.addEventListener("change", onOrientationChange);
    colorSchemeQuery.addEventListener("change", onColorChange);
  });
  useDisconnected(function () {
    landscapeQuery.removeEventListener("change", onOrientationChange);
    colorSchemeQuery.removeEventListener("change", onColorChange);
  });

  /* ----- Exports ----- */

  return {
    $$title,
    $visibility: $$visibility.toReadable(),
    $orientation: $$orientation.toReadable(),
    $colorScheme: $$colorScheme.toReadable(),
  };
}