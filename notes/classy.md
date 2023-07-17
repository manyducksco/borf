# Classes for Views and Stores (again)

Yet another attempt at coming up with a class based API.

## What does this solve?

- Types can be inferred based on the class. Existing function components need to import ComponentContext for type suggestions.

## Examples

```tsx
import { Store, View, Writable, use } from "@borf/browser";

class Example extends Store {
  $$value = new Writable(0);

  // Lifecycle methods are defined on class
  async beforeConnect() {}

  onConnected() {
    // Debug name derived from class name
    this.log("connected");
  }

  // Stores return their exported API from the define() method
  define() {
    return {
      $value: this.$$value.toReadable(),
      increment: () => {
        this.$$value.update((x) => x + 1);
      },
      decrement: () => {
        this.$$value.update((x) => x - 1);
      },
    };
  }
}

class Scrubber extends View<ScrubberAttrs> {
  @use(PanelsStore) panels;
  @use(ProjectsStore) projects;
  @use(ThemeStore) theme;

  $$menuOpen = new Writable(false);
  $$hoveredPanel = new Writable<PanelData<any> | undefined>(undefined);

  $$contactPosition = new Writable<{ x: number; y: number } | null>(null);
  $$contactTimestamp = new Writable<number | null>(null);

  tooltipDebouncer = makeDebouncer(500);
  liftDebouncer = makeDebouncer(1000);

  scrubberRef = new Ref<HTMLElement>();
  viewportRef = new Ref<HTMLElement>();

  viewportTransform = new Spring(this.panels.$viewportPosition.value, {
    stiffness: 1600,
    mass: 2,
    damping: 160,
    velocity: 5,
  });

  lastButtonClick = 0;

  onConnected() {
    this.observe(this.panels.$viewportPosition, (position) => {
      if (this.panels.$$scrubbing.value) {
        this.viewportTransform.snapTo(position);
      } else {
        this.viewportTransform.to(position);
      }
    });
  }

  render() {
    const {
      panels,
      projects,
      theme,
      viewportRef,
      viewportTransform,
      tooltipDebouncer,
      liftDebouncer,
      $$hoveredPanel,
      $$menuOpen,
      onLift,
    } = this;

    return (
      <div
        class={{
          [styles.container]: true,
          [styles.dragging]: panels.$$scrubbing,
        }}
        onmousedown={this.onContact}
        ontouchstart={this.onContact}
      >
        <div
          ref={this.scrubberRef}
          class={styles.scrubber}
          style={{
            transform: panels.$viewportWidth.map(
              (x) => `translateX(-${x / 2}px)`
            ),
          }}
        >
          <div
            class={styles.scrubberPanels}
            style={{
              transform: viewportTransform.map((x) => `translateX(${x}px)`),
              "--panel-base-size": panels.$panelScrubberBaseSize.map(
                (s) => s + "px"
              ),
            }}
          >
            {repeat(
              panels.$current,
              ($panel, $index, ctx) => {
                const $project = Readable.merge(
                  [$panel, projects.$projectList],
                  (panel, projects) => {
                    if (panel.meta.state.projectId != null) {
                      return projects.find(
                        (x) => x.id === panel.meta.state.projectId
                      );
                    }
                  }
                );
                const $color = Readable.merge(
                  [$project, theme.$currentScheme],
                  (project, scheme) => {
                    if (project?.color) {
                      return adjustAccentColor(
                        project.color,
                        scheme === theme.ColorSchemes.Dark
                      );
                    }
                  }
                );
                const $size = $panel.map((x) => x.meta.size);
                const $icon = $panel.map(
                  (x) => panelConfig[x.type as PanelType]?.icons["8"]
                );
                const $isUnknown = $panel.map((x) => !(x?.type in panelConfig));
                // const $isFocused = Readable.merge(
                //   [panels.$$focusedPanelIndex, $index, panels.$closestPanelToCenter, panels.$$scrubbing],
                //   (focused, index, centered, scrubbing) => {
                //     if (scrubbing) {
                //       return centered === index;
                //     } else {
                //       return focused === index;
                //     }
                //   }
                // );

                const $liftOffset = Readable.merge(
                  [panels.$$liftedPanelIndex, $index],
                  (lifted, index) => {
                    const offset = { x: 0, y: 0 };

                    if (lifted === index) {
                      offset.y = -15;
                    }

                    return offset;
                  }
                );

                const xSpring = new Spring(0);
                const ySpring = new Spring(0);

                ctx.observe($liftOffset, (o) => {
                  xSpring.snapTo(o.x);
                  ySpring.to(o.y);
                });

                return (
                  <button
                    class={[styles.panel, { [styles.unknown]: $isUnknown }]}
                    style={{
                      "--panel-size": $size,
                      "--panel-accent": $color.map((c) => c ?? "transparent"),
                      "--panel-hover-accent": $color.map((c) =>
                        c ? c : "var(--color-shade-3)"
                      ),

                      transform: Readable.merge(
                        [xSpring, ySpring],
                        (x, y) => `translate(${x}px, ${y}px)`
                      ),
                      borderColor: $color.map(
                        (c) => c ?? "var(--color-shade-4)"
                      ),
                    }}
                    onclick={() => {
                      if (panels.$$scrubbing.value) return;
                      panels.$$focusedPanelIndex.value = $index.value;
                      tooltipDebouncer.cancel();
                      liftDebouncer.cancel();
                    }}
                    onmouseenter={() => {
                      tooltipDebouncer.queue(() => {
                        $$hoveredPanel.value = $panel.value;
                      });
                    }}
                    onmouseleave={() => {
                      $$hoveredPanel.value = undefined;
                      tooltipDebouncer.cancel();
                    }}
                    onmousedown={() => {
                      liftDebouncer.queue(() => {
                        onLift($index.value);
                      });
                    }}
                    ontouchstart={() => {
                      liftDebouncer.queue(() => {
                        onLift($index.value);
                      });
                    }}
                  >
                    <div class={styles.panelIcon}>
                      <img src={$icon} alt="" />
                    </div>
                  </button>
                );
              },
              (panel) => panel.id
            )}

            <PanelToolTip $panel={$$hoveredPanel.toReadable()} />
          </div>

          {when(
            panels.$current.map((x) => x.length > 0),
            <div
              ref={viewportRef}
              class={styles.scrubberViewport}
              style={{
                width: panels.$viewportWidth.map((x) => x + 12 + "px"),
              }}
            />
          )}
        </div>

        <div
          class={styles.plus}
          onclickaway={() => {
            $$menuOpen.value = false;
          }}
        >
          {when(
            $$menuOpen,
            <div class={styles.plusMenu}>
              <PlusMenu
                onPanelOpened={() => {
                  $$menuOpen.value = false;
                  this.attrs.onPanelOpened();
                }}
              />
            </div>
          )}

          <PlusButton
            $rotate={$$menuOpen.toReadable()}
            onclick={(e) => {
              // Ignore clicks within 50 milliseconds of the last
              if (
                !this.lastButtonClick ||
                e.timeStamp - this.lastButtonClick > 50
              ) {
                $$menuOpen.update((x) => !x);
                this.lastButtonClick = e.timeStamp;
              }
            }}
          />
        </div>
      </div>
    );
  }

  /**
   * Called when a pointer makes contact with the scrubber.
   */
  onContact = (e: MouseEvent | TouchEvent) => {
    if (e instanceof MouseEvent) {
      this.$$contactPosition.value = { x: e.clientX, y: e.clientY };
    } else {
      this.$$contactPosition.value = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }

    this.$$contactTimestamp.value = Date.now();

    window.addEventListener("mousemove", this.onDrag);
    window.addEventListener("touchmove", this.onDrag);
    window.addEventListener("mouseup", this.onRelease);
    window.addEventListener("touchend", this.onRelease);

    this.tooltipDebouncer.cancel();
    this.$$hoveredPanel.value = undefined;
  };

  /**
   * Called when the pointer moves after having made contact.
   */
  onDrag = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();

    const { $$scrubbing, $viewportWidth, $$scrubOffset } = this.panels;

    let position: { x: number; y: number };

    if (e instanceof MouseEvent) {
      position = { x: e.clientX, y: e.clientY };
    } else {
      position = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }

    const contactPosition = this.$$contactPosition.value!;

    if (!$$scrubbing.value && Math.abs(position.x - contactPosition.x) > 5) {
      $$scrubbing.value = true;
      this.liftDebouncer.cancel();
    }

    if ($$scrubbing.value) {
      const scale = window.innerWidth / $viewportWidth.value;
      const offset = position.x - contactPosition.x;

      $$scrubOffset.value = offset * scale;
    }
  };

  /**
   * Called when the pointer loses contact with the screen.
   */
  onRelease = (e: MouseEvent | TouchEvent) => {
    if (e instanceof MouseEvent || e.touches.length === 0) {
      this.$$contactPosition.value = null;
      this.$$contactTimestamp.value = null;

      window.removeEventListener("mousemove", this.onDrag);
      window.removeEventListener("touchmove", this.onDrag);
      window.removeEventListener("mouseup", this.onRelease);
      window.removeEventListener("touchend", this.onRelease);

      // Delayed so states aren't changed until after click events are handled.
      requestAnimationFrame(() => {
        const wasScrubbing = this.panels.$$scrubbing.value;

        this.panels.$$scrubbing.value = false;

        if (wasScrubbing) {
          this.panels.$$focusedPanelIndex.value =
            this.panels.$closestPanelToCenter.value;
        }

        this.panels.$$scrubOffset.value = 0;
      });
    }
  };

  onLift = (index: number) => {
    window.addEventListener("mousemove", this.onRearrange);
    window.addEventListener("touchmove", this.onRearrange);
    window.addEventListener("mouseup", this.onDrop);
    window.addEventListener("touchend", this.onDrop);

    this.panels.$$liftedPanelIndex.value = index;
  };

  onRearrange = (e: MouseEvent | TouchEvent) => {};

  onDrop = (e: MouseEvent | TouchEvent) => {
    window.removeEventListener("mousemove", this.onRearrange);
    window.removeEventListener("touchmove", this.onRearrange);
    window.removeEventListener("mouseup", this.onDrop);
    window.removeEventListener("touchend", this.onDrop);

    this.panels.$$liftedPanelIndex.value = undefined;
  };
}
```
