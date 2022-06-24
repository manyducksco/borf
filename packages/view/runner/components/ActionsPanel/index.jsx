import styles from "./index.module.css";
import { makeState, proxyState } from "@woofjs/client";

/**
 * Displays action log.
 */
export default ($attrs, self) => {
  self.debug.name = "ActionsPanel";

  const { $currentView } = self.getService("view");

  const $actionLog = proxyState([]);

  self.watchState($currentView, (view) => {
    if (view) {
      $actionLog.proxy(view.actions.$log);
    } else {
      $actionLog.unproxy();
    }
  });

  self.watchState($actionLog, self.debug.log);

  return null;
};
