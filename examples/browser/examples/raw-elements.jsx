import { ExampleFrame } from "../views/ExampleFrame";
import { computed, writable } from "@borf/browser";

export default function RawElements(props, c) {
  const $$headerLevel = writable(1);
  const $$headerText = writable("This is the header!");

  // Readables containing renderable values can be passed as children to Markup elements.
  const $heading = computed([$$headerLevel, $$headerText], (level, text) => {
    c.log({ level, text });

    if (level === 1) {
      return <h1>{text}</h1>;
    } else if (level === 2) {
      return <h2>{text}</h2>;
    } else {
      return <h3>{text}</h3>;
    }
  });

  const paragraph = document.createElement("p");
  paragraph.textContent = "This is a raw DOM node.";

  return (
    <ExampleFrame title="Raw Elements">
      <header>{$heading}</header>

      <div>
        <button
          onclick={() => {
            $$headerLevel.set(1);
          }}
        >
          H1
        </button>
        <button
          onclick={() => {
            $$headerLevel.set(2);
          }}
        >
          H2
        </button>
        <button
          onclick={() => {
            $$headerLevel.set(3);
          }}
        >
          H3
        </button>
      </div>

      {paragraph}
    </ExampleFrame>
  );
}
