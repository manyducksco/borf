import { when } from "@woofjs/client";

export default ($attrs, self) => {
  const $name = $attrs.map("name");
  const $quality = $attrs.map("quality");
  const $showQuality = $attrs.map("showQuality");
  const $color = $attrs.map("color", (color) => color || "#000");
  const $punctuation = $attrs.map("punctuation");

  // Mapping multiple attribute values into a single state is possible, like so.
  const $percentage = $attrs.map((attrs) => {
    const percentage = attrs.percentage || 50;
    const multiplier = attrs.multiplier || 1;

    return percentage * multiplier + "%";
  });

  const onclick = $attrs.get("onclick");

  return (
    <div>
      <h1>
        Hello, <span style={{ color: $color }}>{$name}</span>!
      </h1>
      {when(
        $showQuality,
        <p>
          You are {$percentage} {$quality}
          {$punctuation}
        </p>
      )}
      <button onclick={onclick}>Click this button</button>
    </div>
  );
};
