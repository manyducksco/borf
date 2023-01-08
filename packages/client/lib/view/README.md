# Views

Views provide the layer that transforms your app's data into a UI. Also utilities for UIs, such as animations.

A view is essentially an object with the following interface:

```ts
interface View {
  /**
   * Identifies this object as a view.
   */
  readonly isView: true;

  /**
   * True when this view is connected to a parent element.
   */
  readonly isConnected: boolean;

  /**
   * Holds a reference to this view's root DOM node.
   */
  readonly node: HTMLElement;

  /**
   * Connects this view to the DOM as a child of the `parent` element.
   * Optionally, attaches `after` an existing sibling element.
   */
  connect(parent: HTMLElement, after?: HTMLElement): void;

  /**
   * Disconnects this view from its parent and the DOM.
   */
  disconnect(): void;
}
```

Views are created from blueprints, which are objects with the following interface:

```ts
interface Blueprint {
  /**
   * Identifies this object as a blueprint.
   */
  isBlueprint: true;

  /**
   * Creates a new instance of this blueprint's view.
   */
  build(variables: BuildVariables): View;
}
```

The blueprint takes an object with several variables:

```ts
interface BuildVariables {
  /**
   * An object passed down from the app.
   * Contains globals and top-level configuration.
   */
  appContext: AppContext;

  /**
   * An object passed down from the parent.
   * Contains locals and configuration relevant to this view and its children.
   */
  elementContext: ElementContext;

  attributes: { [key: string]: any };

  children: any;
}
```

Children can be:

- A string, or an object with a `.toString()` method.
- An HTML element.
- An instance of a view.

## Idea

Instead of `h.repeat()`, a more controlled approach to lists with a `List` view.

```jsx
import { makeView, List } from "@woofjs/client";

const items = [
  { label: "One", onclick: () => alert("First button clicked") },
  { label: "Two", onclick: () => alert("Second button clicked") },
];

const Example = makeView((ctx) => {
  // Rendered into <ul> with each item rendered into a <li>.

  return (
    <List
      of={items}
      ordered={false} // Set to true to get an <ol>
      class={styles.list}
      itemClass={styles.listItem}
      itemTransitions={fadeInOut}
      render={($item) => {
        const $label = $item.as((x) => x.label);
        const $onclick = $item.as((x) => x.onclick);

        return <button onclick={$onclick}>{$label}</button>;
      }}
    />
  );

  // Works when items is an array of renderable elements.
  return <List of={items} />;
});
```
