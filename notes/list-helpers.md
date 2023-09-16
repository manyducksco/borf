# List Helpers

Thinking of adding some more specialized helpers for rendering lists; `list` and `vlist`.

## list

The `list` helper would manage the `<ul>`/`<ol>` and `<li>` parts of the list, supporting animations on enter, exit and reordering of items out of the box. Whereas `repeat` can render any structure without a container element, `list` can only render structured HTML lists.

```jsx
<div>
  {list($data, {
    ordered: true, // Uses an <ol> instead of default <ul>

    // Props for the list element and container element. Forwarded directly to elements.
    listProps: { className: "container-class" },
    itemProps: { className: "item-class" },

    itemKey: (item) => item.id, // generate unique key to identify this item
    itemContent: ($item, $index, ctx) => {
      // Render content inside <li>
    },

    transitions: {
      enter: async ({ li }) => {
        // Perform animation on li element. Resolve promise when complete.
      },
      exit: async ({ li }) => {
        // Perform animation on li element. Resolve promise when complete.
      },
    },
  })}
</div>
```

## vlist

The `vlist` helper follows the same API as `list` but handles list items virtually, useful for dealing with massive lists.

```jsx
<div>
  {vlist($data, {
    ordered: true, // Uses an <ol> instead of default <ul>
    itemKey: (item) => item.id,
    itemContent: ($item, $index, ctx) => {
      // Render content inside <li>
    },
  })}
</div>
```
