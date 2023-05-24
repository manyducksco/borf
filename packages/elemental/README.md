# `@borf/elemental`

> NOTE: This library is extremely early in development and is probably broken in a lot of ways. Use at your own risk.

A novel way to write web components (A.K.A. custom elements). Perfect for adding components to an existing website without rewriting it all in a full JavaScript framework.

In a JS file (`elements.js`):

```js
import { element, html, css } from "https://unpkg.com/@borf/elemental";

// Define a new element with its HTML tag name,
// (optional) array of observed attributes which will cause a re-render when they are set,
// and a callback function that defines the element
element("elemental-example", ["title"], (c) => {
  // for debugging
  c.debug("printed when window.ELEMENTAL_LOG_LEVEL >= 'debug' or 0");
  c.info("fyi");
  c.log("message");
  c.warn("bad!");
  c.error("really bad!!");

  // access element's internal state
  c.get();
  c.get("value");
  c.set({ value: 5 });
  c.set("value", 5);

  // listen for events ('connect' and 'disconnect' are only emitted inside the element)
  c.on("connect", () => {
    c.log("view is now connected");
  });
  c.on("disconnect", () => {
    c.log("view is now disconnected");
  });

  // also standard DOM events
  c.on("click", () => {
    c.log("a click event bubbled up");
  });

  // emit custom events (listen to this one with 'onexplode')
  c.emit("explode", { message: "BOOM!" });

  // render with virtual DOM which doesn't eat your whole function scope
  c.render((state, attrs) => {
    return html`
      <div>
        <h1>${attrs.title}</h1>
        <slot />
      </div>
    `;
  });
});
```

In an HTML file (`index.html`):

```html
<html>
  <body>
    <elemental-example title="This is a header!">
      <p>This is a child of the elemental view</p>
    </elemental-example>

    <script src="./elements.js" type="module"></script>
  </body>
</html>
```

## Questions / Design

- Should attributes be written in HTML in `kebab-case` but passed to the element in `camelCase`? HTML is not case sensitive but JS is, and JS doesn't deal well with dashes in property names.
