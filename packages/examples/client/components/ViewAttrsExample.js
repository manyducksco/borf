import { when } from "@woofjs/client";

export default ($attrs, self) => {
  const $name = $attrs.map("name");
  const $quality = $attrs.map("quality");
  const $showQuality = $attrs.map("showQuality");
  const $color = $attrs.map("color", (color) => color || "#000");

  const onclick = $attrs.get("onclick");

  return (
    <div>
      <h1>
        Hello, <span style={{ color: $color }}>{$name}</span>!
      </h1>
      {when($showQuality, <p>You are {$quality}.</p>)}
      <button onclick={onclick}>Click this button</button>
    </div>
  );
};
