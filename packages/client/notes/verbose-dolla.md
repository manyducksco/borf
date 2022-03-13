# Idea: Verbose Dolla

I'm thinking of making $ helpers more verbose so they're easier to pick apart from JSX:

```js
// Match Array.forEach from standard JS
$.forEach($state, ($, self) => {
  const $index = self.$attrs.map("index");
  const $value = self.$attrs.map("value"); // changing from 'item' to 'value' (all helpers use 'value')

  return <div>Component</div>;
});

// Both if and else made clear by the function's name
$.ifElse(
  $state,
  () => {
    return <p>When true</p>;
  },
  () => {
    return <p>When false</p>;
  }
);

// Standalone else statement is intuitive based on function name
$.ifElse($state, null, () => {
  return <p>Just else. Don't even need $.unless this way.</p>;
});

// Camel case matches other helpers and clarifies the type
$.asText($state);

// Be explicit about what it takes
<input type="text" value={$.bindState($value)} />;

// Like self.watchState but with a component
$.watchState($state, ($, self) => {
  return <h1>{$.asText(self.map("value"))}</h1>;
});
```

Alternate component attribute getters (more compact)

```js
// Usage:
<Example value="Some text." />;

// Component:
const Example = makeComponent(($, self) => {
  const value = self.get("value"); // Alias self.get and self.map to self.$attrs.*?
  const $value = self.map("value"); // Accessing attrs is so common that this makes sense to me.

  // Put other data in attrs too but prefix with @?
  const href = self.get("@route.href");

  // Get all attrs:
  const attrs = self.get(); // Includes only the attrs passed to this component from parent
  const route = self.get("@route"); // Special @attrs must be accessed explicitly

  // What if there were no self.$attrs or self.$route?
  // self would be just .get() and .map(), .getService(), and the lifecycle hooks
});
```
