import { makeState, makeView } from "@woofjs/client";
import dayjs from "dayjs";

import styles from "./index.module.css";

import Panel from "../Panel";

/**
 * Displays action log.
 */
export default makeView((ctx, h) => {
  ctx.name = "ActionsPanel";

  const { $currentView } = ctx.global("view");

  const $$actionLog = makeState([]);
  const $actionsCalled = $actionLog.as((log) => log.length > 0);

  ctx.observe($currentView, (view) => {
    // if (view) {
    //   $actionLog.proxy(view.actions.$log);
    // } else {
    //   $actionLog.unproxy();
    // }
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
      {h.unless($actionsCalled, <p>No actions fired yet.</p>)}

      {h.when(
        $actionsCalled,
        <ol class={styles.actionList}>
          {h.repeat($$actionLog, function ($value) {
            const $name = $value.as((x) => x.name);
            const $message = $value.as((x) => x.message);
            const $timestamp = $value.as((x) =>
              dayjs(x.timestamp).format("HH:mm:ss")
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
});
