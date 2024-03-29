import { unless, makeState } from "@woofjs/client";

import styles from "./index.module.css";

/**
 * Resizable sidebar component. Drag handle can be placed on left or right side.
 * Stores its last size in localStorage identified by its unique `id` attribute.
 */
export default function Sidebar() {
  this.debug.name = "Sidebar";

  const minWidth = 220;
  const defaultWidth = 300;

  const { screen } = this.services;
  const $id = this.$attrs.map("id");
  const $settingsKey = $id.map((id) => `woof-view-sidebar-${id}-size`);
  const $resizeHandle = this.$attrs.map("resizeHandle");
  const $noHandle = $resizeHandle.map(
    (value) => value === "none" || value == null
  );

  const $ref = makeState();
  const $size = makeState(defaultWidth);
  const $sizePx = $size.map((size) => size + "px");
  const $dragging = makeState(false);

  const onWindowMouseUp = () => {
    $dragging.set(false);
    screen.$dragging.set(false);
  };

  const onWindowMouseMove = (e) => {
    const side = $resizeHandle.get();
    const rect = $ref.get().getBoundingClientRect();

    e.preventDefault();

    let size;

    if (side === "left") {
      size = rect.right - e.clientX;
    } else if (side === "right") {
      size = e.clientX - rect.left;
    }

    $size.set(Math.max(minWidth, size));
  };

  // Add/remove mousemove handler depending on drag state.
  this.watchState($dragging, (dragging) => {
    if (dragging) {
      window.addEventListener("mousemove", onWindowMouseMove);
    } else {
      window.removeEventListener("mousemove", onWindowMouseMove);
    }
  });

  // Store size when it changes.
  this.watchState($size, (size) => {
    window.localStorage.setItem($settingsKey.get(), JSON.stringify(size));
  });

  this.beforeConnect(() => {
    // Load size from localStorage.
    const stored = JSON.parse(
      window.localStorage.getItem($settingsKey.get()) || `${defaultWidth}`
    );
    $size.set(stored);

    // Listen for mouseup to end drag.
    window.addEventListener("mouseup", onWindowMouseUp);
  });

  // Clean up event handlers on disconnect.
  this.afterDisconnect(() => {
    window.removeEventListener("mouseup", onWindowMouseUp);
    window.removeEventListener("mousemove", onWindowMouseMove);
  });

  return (
    <div
      $ref={$ref}
      class={styles.sidebar}
      style={{
        width: $sizePx,
        flexBasis: $sizePx,
      }}
    >
      {unless(
        $noHandle,
        <div
          class={{
            [styles.resizeHandle]: true,
            [styles.left]: $resizeHandle.map((value) => value === "left"),
            [styles.right]: $resizeHandle.map((value) => value === "right"),
            [styles.dragging]: $dragging,
          }}
          onmousedown={(e) => {
            e.preventDefault();
            $dragging.set(true);
            screen.$dragging.set(true);
          }}
        />
      )}

      <div class={styles.content}>{this.children}</div>
    </div>
  );
}
