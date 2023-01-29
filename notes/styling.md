# Styling

CSS modules are really convenient but they require a bundler. Can I come up with something using JS functions that composes just as well as CSS stylesheets? Probably not, but that won't stop me trying.

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
