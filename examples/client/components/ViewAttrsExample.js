import { when } from "@woofjs/client";
import { prop, propOr } from "ramda";

/**
 * A component to test woof-view attribute handling.
 */
export function ViewAttrsExample() {
  const { $attrs } = this;

  const $name = $attrs.map(prop("name"));
  const $quality = $attrs.map(prop("quality"));
  const $showQuality = $attrs.map(prop("showQuality"));
  const $color = $attrs.map(propOr("#000", "color"));
  const $punctuation = $attrs.map(prop("punctuation"));

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
}
