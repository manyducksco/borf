import { makeWindow } from "@woofjs/window";
import { makeState } from "@woofjs/client";
import { MouseFollowerExample } from "./MouseFollowerExample";

export default makeWindow({
  view: (ctx, h) => (
    <div style={{ padding: "1rem", border: "1px solid red" }}>
      <MouseFollowerExample />
    </div>
  ),
  globals: {
    mouse: (ctx) => {
      const $$position = makeState({ x: 100, y: 100 });
      return {
        $position: $$position.readable(),
      };
    },
  },
  attrs: {
    $name: {
      input: "text",
      value: makeState("value").readable(),
    },
  },
  sets: [
    {
      name: "Defaults",
      attrs: {
        $name: {
          input: "text",
          value: makeState("value").readable(),
        },
      },
    },
  ],
});
