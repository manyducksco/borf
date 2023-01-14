```jsx
const Example = makeView(function () {
  this.beforeConnect(function () {
    // Lifecycle methods retain view context for `this`.
    this.log("Not yet connected.");
  });

  const $whatever = this.attrs.readable("something");

  return <h2>{$whatever}</h2>;
});

// This seems easiest to understand. Use as convention for docs.
// The "configurator" pattern. makeSomething that takes a func that takes a self to configure.
const Example = makeView((self) => {
  self.beforeConnect(() => {
    self.log("Not yet connected.");
  });

  const $whatever = self.attrs.readable("something");

  return <h2>{$whatever}</h2>;
});

const Example = makeView((ctx) => {
  ctx.beforeConnect(() => {
    ctx.log("Not yet connected.");
  });

  const $whatever = ctx.attrs.readable("something");

  return <h2>{$whatever}</h2>;
});
```
