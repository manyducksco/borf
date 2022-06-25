import { repeat, when, unless, proxyState, makeState } from "@woofjs/client";
import dayjs from "dayjs";

import styles from "./index.module.css";

/**
 * Displays action log.
 */
export default ($attrs, self) => {
  self.debug.name = "ActionsPanel";

  const { $currentView } = self.getService("view");

  const $actionLog = proxyState([]);
  const $hasActions = makeState(false);

  self.watchState($currentView, (view) => {
    if (view) {
      $hasActions.set(view.actions.fns.length > 0);
      $actionLog.proxy(view.actions.$log);
    } else {
      $hasActions.set(false);
      $actionLog.unproxy();
    }
  });

  return (
    <section class={styles.panel}>
      <header class={styles.panelHeader}>
        <h1>💡 Actions</h1>
        <button
          onclick={() => {
            $actionLog.set([]);
          }}
        >
          clear
        </button>
      </header>

      <div class={styles.panelContent}>
        {unless($hasActions, <p>This view has no actions.</p>)}

        {when(
          $hasActions,
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
      </div>
    </section>
  );
};
