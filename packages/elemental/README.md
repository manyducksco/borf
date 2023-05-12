# `@borf/elemental`

A package for Borf-flavored web components (A.K.A. custom elements). Perfect for adding components to an existing website without rewriting it all in a full JavaScript framework.

In a JS file (`elements.js`):

```js
import { defineElement, html, Outlet } from "https://unpkg.com/@borf/elemental";

defineElement("example-view", function ExampleView({ title }) {
  // Elemental uses tagged template literals to get close to
  // JSX while staying drop-in compatible with web browsers.
  return html`
    <div>
      <h1>${title}</h1>

      <${Outlet} />
    </div>
  `;
});
```

In an HTML file (`index.html`):

```html
<html>
  <body>
    <example-view title="This is a header!">
      <p>This is a child of the elemental view</p>
    </example-view>

    <script src="./elements.js" type="module"></script>
  </body>
</html>
```

## Questions / Design

- Does this support built-in stores (`http`, `document`, `router`, `language`)? Leaning toward no.
- Should attributes be written in HTML in `kebab-case` but passed to the component in `camelCase`? HTML is not case sensitive and JS is, and JS doesn't deal well with dashes in property names.
- Re-exports a subset of hooks and classes from `@borf/browser`. Meant to be used as an alternative.
- No "page-level" stores, just local ones as custom elements?
