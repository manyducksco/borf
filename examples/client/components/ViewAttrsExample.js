import { when } from "@woofjs/client";

/**
 * A component to test woof-view attribute handling.
 */
export default ({ $attrs }) => {
  const $name = $attrs.map((a) => a.name);
  const $quality = $attrs.map((a) => a.quality);
  const $showQuality = $attrs.map((a) => a.showQuality);
  const $color = $attrs.map((a) => a.color || "#000");
  const $punctuation = $attrs.map((a) => a.punctuation);

  // Mapping multiple attribute values into a single state is possible, like so.
  const $percentage = $attrs.map((attrs) => {
    const percentage = attrs.percentage || 50;
    const multiplier = attrs.multiplier || 1;

    return percentage * multiplier + "%";
  });

  const onclick = $attrs.get((a) => a.onclick);

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
