import { type AppContext } from "../classes/App.js";
import { APP_CONTEXT, getCurrentComponent } from "../keys.js";

/**
 * Returns the app context. This hook is for internal use and should not be exported.
 */
export function _useAppContext(): AppContext {
  const core = getCurrentComponent();
  return (core as any)[APP_CONTEXT];
}
