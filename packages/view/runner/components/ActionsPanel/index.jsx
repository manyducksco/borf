import { repeat, when, unless, makeProxyState } from "@woofjs/client";
import dayjs from "dayjs";

import styles from "./index.module.css";

import Panel from "../Panel";

/**
 * Displays action log.
 */
export default function ActionsPanel() {
  this.debug.name = "ActionsPanel";

  const { $currentView } = this.services.view;

  const $actionLog = makeProxyState([]);
  const $actionsCalled = $actionLog.map((log) => log.length > 0);

  this.watchState($currentView, (view) => {
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
          {repeat($actionLog, function () {
            const $name = this.$attrs.map("value.name");
            const $message = this.$attrs.map("value.message");
            const $timestamp = this.$attrs.map("value.timestamp", (ts) =>
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
}
