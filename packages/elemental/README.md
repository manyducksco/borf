# `@borf/elemental`

A package for Borf-flavored web components (A.K.A. custom elements). Perfect for adding components to an existing website without rewriting it all in a full JavaScript framework.

In a JS file (`elements.js`):

```js
import { element, html, css } from "https://unpkg.com/@borf/elemental";

// What if this actually does use VDOM?
// State is stored inside the instance
element("elemental-example", (c) => {
  // function takes a context object:
  c.log(c);

  // for debugging
  c.debug("printed when window.ELEMENTAL_LOG_LEVEL >= 'debug' or 0");
  c.info("fyi");
  c.log("message");
  c.warn("bad!");
  c.error("really bad!!");

  // access state
  c.get();
  c.get("value");
  c.set({ value: 5 });
  c.set("value", 5);

  // listen for events (these two are only emitted inside the component)
  c.on("connect", () => {
    c.log("view is now connected");
  });
  c.on("disconnect", () => {
    c.log("view is now disconnected");
  });

  // including standard DOM events
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

  // applied to rendered content (dynamic just like render function)
  c.styles((state, attrs) => {
    return css`
      h1 {
        color: "red";
        font-weight: ${state.value > 7 ? "bold" : undefined};
        font-size: ${state.value}px;
      }
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
