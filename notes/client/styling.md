# Styling

CSS modules are really convenient but they require a bundler. Can I come up with something using JS functions that composes just as well as CSS stylesheets?

```js
const makeClass = () => {};

const button = css`
  color: blue;
  border: 2px solid orange;
`;

const active = css`
  color: red;
`;

// Multiple classes
button.and(".active")`
  color: red;
`;

// Class references
button.and(active)`
  border: 1px solid orange;
`;

// Chainable
button.not(".active").and(".cool")`

`;

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

const active = makeClass({

});

button.active(active);

export button;

import * as styles from "./styles.js";

styles.button
```
