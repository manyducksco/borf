import { repeat, when, unless, proxyState, makeState } from "@woofjs/client";
import dayjs from "dayjs";

import styles from "./index.module.css";

import Panel from "../Panel";

/**
 * Displays action log.
 */
export default ($attrs, self) => {
  self.debug.name = "ActionsPanel";

  const { $currentView } = self.getService("view");

  const $actionLog = proxyState([]);
  const $actionsCalled = $actionLog.map((log) => log.length > 0);

  self.watchState($currentView, (view) => {
    if (view) {
      $actionLog.proxy(view.actions.$log);
    } else {
      $actionLog.unproxy();
    }
  });

  return (
    <Panel
      header={
        <div class={styles.panelHeader}>
          <h1>💡 Actions</h1>
          <button
            class={styles.clearButton}
            onclick={() => {
              $actionLog.set([]);
            }}
          >
            clear
          </button>
        </div>
      }
    >
      {unless($actionsCalled, <p>No actions fired yet.</p>)}

      {when(
        $actionsCalled,
        <ol class={styles.actionList}>
          {repeat($actionLog, ($attrs, self) => {
            const $name = $attrs.map("value.name");
            const $message = $attrs.map("value.message");
            const $timestamp = $attrs.map("value.timestamp", (ts) =>
              dayjs(ts).format("HH:mm:ss")
            );

            return (
              <li class={styles.action}>
                [{$name}] {$message} @{$timestamp}
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
};
