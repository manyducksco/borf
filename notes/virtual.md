# Virtual Template Helper

There are UIs built off complex enough data that you have to nest `repeat`s (such as Quack chat) and things start to get really inefficient for rendering. Elements are unnecessarily torn down and recreated when they are the same.

Borf views don't use VDOM by default, but it would be nice to have an opt-in helper for a diffed subtree when you have UIs that just don't structure well in the rigid and mechanical world of Borf state.

```js
import { virtual } from "@borf/browser";

export function ExampleView() {
  return (
    <div>
      {virtual($reallyComplexState, (state) => {
        // This function re-runs every time $reallyComplexState changes, but returned markup is diffed and reused as much as possible.
        // The old element will be updated in place if element type and attributes are deep equal.

        return <div>{/* Really complex template */}</div>;
      })}
    </div>
  );
}
```

## Algorithm

Starting with the existing tree vs a newly constructed tree, recursively compare each node.

- If the element type is different:
  - If both are HTML elements, replace the existing element with the new one but pass the same children (which may not need to be replaced). Diff children.
  - If the new element is a component, replace with an instance of the new component.
  - If types are different, replace.
- If the element type is the same:
  - If HTML elements, update attributes and diff children.
  - If components:
    - If the component constructor is the same:
      - If the attributes are deep equal, keep the old instance. Update $$children.
      - If the attributes are different, recreate the component.

```ts
type VirtualNode = {
  type: string | Component;
  attributes: Record<string, any>;
  children: VirtualNode[];
};

function patch(oldNode, newNode) {
  if (oldNode.type === newNode.type) {
    return update(oldNode, newNode);
  } else {
    return replace(oldNode, newNode);
  }
}

// Update the existing node, if possible.
function update(oldNode, newNode) {
  if (deepEqual(oldNode.attributes, newNode.attributes)) {
    // No changes required. (what about children?)
  } else {
    replace(oldNode, newNode);
  }
}

// Replace the existing node with the new one.
function replace(oldNode, newNode) {
  oldNode.disconnect();
  // TODO: compare and patch children
  newNode.connect();
}
```

What if there was just one helper for dynamic data; `render`, which is virtual.

```js
import { html, render, Writable } from "@borf/browser";

// Could do a React-like thing if you wanted.
export function ExampleView() {
  const $$state = new Writable({
    items: [
      { id: 1, name: "First" },
      { id: 2, name: "Second" },
      { id: 3, name: "Third" },
    ],
    activeId: 2,
  });

  // Everything above this is a stable scope. Good place for side effects and references.

  return render($$state, (state) => {
    // Everything below this runs over and over again. Avoid side-effects.
    return (
      <ul>
        {state.items.map((item) => (
          <li
            id={"item" + item.id}
            class={{ active: item.id === state.activeId }}
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
```
