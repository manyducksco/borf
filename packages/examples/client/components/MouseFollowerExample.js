import { when, makeState } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

function MouseFollowerExample($attrs, self) {
  self.debug.name = "MouseFollowerExample";

  logLifecycle(self);

  const { $position } = self.getService("mouse");
  const bestColor = "#ff0088";

  const $isEnabled = makeState(false);
  const $isDisabled = $isEnabled.map((yes) => !yes);
  const $backgroundColor = makeState(bestColor);
  const $transform = $position.map(
    (pos) => `translate(${pos.x}px, ${pos.y}px)`
  );
  const $isNotBestColor = $backgroundColor.map(
    (hex) => hex.toLowerCase() !== bestColor
  );

  const resetColor = () => {
    $backgroundColor.set(bestColor);
  };

  const randomizeColor = () => {
    const hex = [Math.random() * 256, Math.random() * 256, Math.random() * 256]
      .map(Math.floor)
      .map((n) => n.toString(16))
      .join("");

    $backgroundColor.set("#" + hex);
  };

  // return v("div", { class: "example" }, [
  //   v("h3", "More complex state management"),
  //   v("div", [
  //     when(
  //       $isEnabled,
  //       v("div", {
  //         class: "follower",
  //         style: {
  //           transform: $transform,
  //           backgroundColor: $backgroundColor,
  //         },
  //       })
  //     ),

  //     v("button", { onclick: randomizeColor, disabled: $isDisabled }, [
  //       "Change Follower Color",
  //     ]),

  //     when(
  //       $isNotBestColor,
  //       v("button", { onclick: resetColor, disabled: $isDisabled }, [
  //         "Reset to Best Color",
  //       ])
  //     ),

  //     v("button", { onclick: () => $isEnabled.set((yes) => !yes) }, [
  //       $isEnabled.map((yes) =>
  //         yes ? "Turn Off Follower" : "Turn On Follower"
  //       ),
  //     ]),
  //   ]),
  // ]);

  return (
    <div class="example">
      <h3>More complex state management</h3>
      <div>
        {when(
          $isEnabled,
          <div
            class="follower"
            style={{
              transform: $transform,
              backgroundColor: $backgroundColor,
            }}
          />
        )}

        <button onclick={randomizeColor} disabled={$isDisabled}>
          Change Follower Color
        </button>

        {when(
          $isNotBestColor,
          <button onclick={resetColor} disabled={$isDisabled}>
            Reset to Best Color
          </button>
        )}

        <button onclick={() => $isEnabled.set((yes) => !yes)}>
          {$isEnabled.map((yes) =>
            yes ? "Turn Off Follower" : "Turn On Follower"
          )}
        </button>
      </div>
    </div>
  );
}

export default MouseFollowerExample;
