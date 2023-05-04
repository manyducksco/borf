import { getCurrentContext } from "../component.js";

/**
 * Returns a function that takes an error and triggers a crash to a page that displays that error.
 * The crash page itself can be customized for the app by passing a view to `App.setCrashView()`.
 */
export function useCrash() {
  const ctx = getCurrentContext();

  /**
   * Takes an Error object, unmounts the app and displays its crash page.
   */
  return function crash(error: Error) {
    ctx.appContext.crashCollector.crash({ error, componentName: ctx.name });
  };
}
