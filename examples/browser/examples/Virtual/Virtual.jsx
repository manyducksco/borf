import { virtual, Writable } from "@borf/browser";
import styles from "./Virtual.module.css";

// Could do a React-like thing if you wanted.
export function Virtual(attrs, ctx) {
  const $$state = new Writable({
    items: [
      { id: 1, name: "First" },
      { id: 2, name: "Second" },
      { id: 3, name: "Third" },
    ],
    activeId: 2,
  });

  // Everything above this is a stable scope. Good place for side effects and references.

  return virtual($$state, (state) => {
    // Everything below this runs over and over again. Avoid side-effects.
    ctx.log("Rendering virtual tree");

    return (
      <ul>
        {state.items.map((item) => (
          <li
            id={"item" + item.id}
            class={{ [styles.active]: item.id === state.activeId }}
          >
            <button
              onclick={() => {
                // Trigger a re-render by changing the state.
                $$state.update((current) => {
                  current.activeId = item.id;
                });
              }}
            >
              {item.name}
            </button>
          </li>
        ))}
      </ul>
    );
  });
}
