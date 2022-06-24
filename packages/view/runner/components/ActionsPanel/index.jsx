import { repeat, proxyState } from "@woofjs/client";
import dayjs from "dayjs";

import styles from "./index.module.css";

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

  return (
    <div>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Actions</h2>
        <button
          onclick={() => {
            $actionLog.set([]);
          }}
        >
          clear
        </button>
      </header>

      <ul style={{ fontSize: "0.8rem" }}>
        {repeat($actionLog, ($attrs, self) => {
          const $name = $attrs.map("value.name");
          const $message = $attrs.map("value.message");
          const $timestamp = $attrs.map("value.timestamp", (ts) =>
            dayjs(ts).format("HH:mm:ss")
          );

          return (
            <li>
              [{$name}] {$message} @{$timestamp}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
