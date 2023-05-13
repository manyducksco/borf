# Styling

New thoughts since latest API change.

```js
export function ExampleView(attrs, ctx) {
  const $$color = new Writable("#ff0088");

  // CSS template with readable value support.
  // Applied to a shadow DOM in which this view's nodes are rendered.
  ctx.styles = css`
    p {
      color: ${$$color};
    }
  `;

  return html`
    <div>
      <p>This is styled.</p>
    </div>
  `;
}
```

---

CSS modules are really convenient but they require a bundler. Can I come up with something using JS functions that composes just as well as CSS stylesheets? Probably not, but that won't stop me trying.

```js
class Example extends View {
  // Styles will be applied inside the example view's shadow DOM.
  // Functions within delimiters will receive inputs and return the value for the CSS property whenever inputs change.
  static styles = css`
    .someThing {
      color: ${(inputs) => inputs.textColor || "red"};
    }
  `;
}
```

Or maybe a more modular approach to composing styles?

```js
const button = css`
  color: blue;
  border: 2px solid orange;
`;

const active = css`
  color: red;
`;

// Multiple classes
button.with(".active")`
  color: red;
`;

// Class references
button.with(active)`
  border: 1px solid orange;
`;

// Chainable
button.without(".active").with(".cool")`
  border: 1px solid red;
`;

// Chainable: Object syntax
button.without(".active").with(".cool")({
  border: "1px solid red"
});

// Pseudo selectors
button.pseudo("before")`

`;

const active = css({
  color: red;
});

const button = css({
  color: blue;
  border: "2px solid orange";
});

// Pseudo selectors are methods on the class object
button.active({
  /* styles */
});
button.not(active.lastChild, {
  /* styles */
});
button.after({
  /* styles */
});
button.not(active).after({
  /* styles */
});

// Media queries:
button.media("screen", "min-width: 600px")({
  /* styles */
});

button.media("print")({
  /* styles */
})

const active = css({

});

const hovering = css({

});

button.active(active); // Apply 'active' styles when button is active.
button.hover(hovering); // Apply 'hovering' styles when button is hovered over.

export button;

import * as styles from "./styles.js";

styles.button
```

## BSS: Better Style Sheets

```js
import BSS from "@borf/bss";

// Creates a new bss instance with the specified config overrides
const bss = new BSS({
  unit: "4px",
  colors: {
    flamingo: "#f08",
  },
  scheme: "dark", // Perma-dark theme (always include dark styles in base)
});

// Immutable chaining, so you can safely create derivative classes without mutating the original.
// Class is only attached to the document when used.
const container = bss
  .class({
    // Better properties that translate to one or more CSS style rules.
    flow: "down",
    padding: 2, // in units
    bg: bss.color("flamingo").desaturate(0.5),
    x: bss.var("some-name"),
  })
  .vars({
    /* vars are set for this class and children */
  })
  .dark({
    /* Overrides for dark mode */
  })
  .light({
    /* Overrides for light mode */
  })
  .widerThan(360, {
    /* Media query for >360px */
  })
  .hover({
    /* Hover (true hover:hover media query) styles */
  })
  .before({})
  .after({})
  .firstChild({})
  .lastChild({})
  .placeholder({})
  .focus({})
  // Aliases for browser-specific scrollbar styling
  .scrollBar({})
  .scrollHandle({});

const extended = container.extend({
  /* Additions to base styles */
});

container; // Access generated styles as a style object
```
