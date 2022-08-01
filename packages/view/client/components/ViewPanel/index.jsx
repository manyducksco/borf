import { when, makeState, mergeStates } from "@woofjs/client";

import styles from "./index.module.css";
import AttributesOverlay from "./AttributesOverlay";
import ToggleButton from "./ToggleButton";
import ButtonSet from "./ButtonSet";

export default function ViewPanel() {
  this.debug.name = "ViewPanel";

  const { screen, page } = this.services;
  const { $frameRef, $currentAttrs, $currentView } = this.services.view;

  const $viewTitle = mergeStates(page.$title, $currentView, (title, view) => {
    if (view == null) {
      return "No View";
    }

    if (view.name === "@default") {
      return title;
    }

    return `${title}: ${view.name}`;
  });

  const $responsiveMode = makeState(false);
  const $viewportSize = makeState({ x: 350, y: 700 });
  const $canvasRef = makeState();
  const $canvasSize = makeState({ x: 0, y: 0 });

  const $showAttrsOverlay = makeState(false);

  const $viewportBoundsSize = mergeStates(
    $viewportSize,
    $canvasSize,
    $responsiveMode,
    (viewport, canvas, responsive) => {
      if (!responsive) {
        return canvas;
      }

      return {
        x: Math.max(0, Math.min(viewport.x, canvas.x)),
        y: Math.max(0, Math.min(viewport.y, canvas.y)),
      };
    }
  );

  const $dragging = makeState(false);
  const $dragAxis = makeState(); // 'x', 'y' or 'xy'

  function onResizeWindow(e) {}

  function onMouseUp(e) {
    endDrag();
  }

  function onMouseMove(e) {
    const canvasRect = $canvasRef.get().getBoundingClientRect();

    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;

    const axis = $dragAxis.get();

    $viewportSize.set((size) => {
      if (axis === "xy") {
        size.x = x;
        size.y = y;
      } else if (axis === "x") {
        size.x = x;
      } else if (axis === "y") {
        size.y = y;
      }
    });
  }

  function startDrag(axis) {
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);

    $dragAxis.set(axis);
    $dragging.set(true);
    screen.$dragging.set(true);
  }

  function endDrag() {
    window.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("mousemove", onMouseMove);

    $dragging.set(false);
    screen.$dragging.set(false);
  }

  this.beforeConnect(() => {
    window.addEventListener("resize", onResizeWindow);
  });

  this.afterConnect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        $canvasSize.set((size) => {
          size.x = entry.contentRect.width;
          size.y = entry.contentRect.height;
        });
      }
    });

    observer.observe($canvasRef.get());
  });

  this.beforeDisconnect(() => {
    window.removeEventListener("resize", onResizeWindow);

    endDrag();
  });

  return (
    <div class={styles.container}>
      <header class={styles.toolbar}>
        <div class={styles.viewTitle}>
          <h1>{$viewTitle}</h1>
          <span class={styles.viewportSize}>
            {$viewportBoundsSize.map((size) => `${size.x}x${size.y}`)}
          </span>
        </div>

        <div class={styles.buttons}>
          <ToggleButton $active={$responsiveMode}>Responsive</ToggleButton>
          <ToggleButton $active={$showAttrsOverlay}>Attrs Overlay</ToggleButton>
        </div>
      </header>

      <div $ref={$canvasRef} class={styles.canvas}>
        {when($showAttrsOverlay, <AttributesOverlay value={$currentAttrs} />)}

        <div
          class={styles.viewport}
          style={{
            width: $viewportBoundsSize.map((size) => `${size.x}px`),
            height: $viewportBoundsSize.map((size) => `${size.y}px`),
          }}
        >
          <iframe
            class={styles.iframe}
            $ref={$frameRef}
            style={{
              pointerEvents: screen.$dragging.map((on) =>
                on ? "none" : "all"
              ),
            }}
            src="/frame.html"
          />
        </div>

        {when(
          $responsiveMode,
          <>
            <div class={styles.responsiveControls}>
              <button
                class={styles.rotateButton}
                title="Toggle between horizontal and vertical viewport orientation."
                onclick={() => {
                  $viewportSize.set((size) => {
                    const x = size.x;
                    const y = size.y;

                    size.x = y;
                    size.y = x;
                  });
                }}
              >
                🔄
              </button>
              <ButtonSet
                items={[
                  {
                    label: "Mobile",
                    onclick: () => {
                      $viewportSize.set((size) => {
                        size.x = 350;
                        size.y = 700;
                      });
                    },
                  },
                  {
                    label: "Tablet",
                    onclick: () => {
                      $viewportSize.set((size) => {
                        size.x = 1024;
                        size.y = 768;
                      });
                    },
                  },
                  {
                    label: "Full",
                    onclick: () => {
                      $viewportSize.set((size) => {
                        const canvasRect = $canvasRef
                          .get()
                          .getBoundingClientRect();

                        size.x = canvasRect.width;
                        size.y = canvasRect.height;
                      });
                    },
                  },
                ]}
              />
            </div>
            <div
              class={[styles.viewportSizer, styles.vertical]}
              title="Resize viewport along the X axis."
              style={{
                transform: $viewportBoundsSize.map(
                  (size) => `translateX(${size.x - 4}px)`
                ),
              }}
              draggable={false}
              onmousedown={(e) => {
                e.preventDefault();
                startDrag("x");
              }}
            >
              <div class={styles.line} />
            </div>
            <div
              class={[styles.viewportSizer, styles.horizontal]}
              title="Resize viewport along the Y axis."
              style={{
                transform: $viewportBoundsSize.map(
                  (size) => `translateY(${size.y - 4}px)`
                ),
              }}
              draggable={false}
              onmousedown={(e) => {
                e.preventDefault();
                startDrag("y");
              }}
            >
              <div class={styles.line} />
            </div>
            <div
              class={[styles.viewportSizerHub]}
              title="Resize viewport along both X and Y axes."
              style={{
                transform: $viewportBoundsSize.map(
                  (size) => `translate(${size.x - 13}px, ${size.y - 13}px)`
                ),
              }}
              draggable={false}
              onmousedown={(e) => {
                e.preventDefault();
                startDrag("xy");
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
