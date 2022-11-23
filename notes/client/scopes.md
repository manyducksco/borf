# View state scopes

Views can create a scope, which is an object containing whatever superviews have put in it. Essentially, implicitly-passed attributes.

```js
function Super(ctx, h) {
  // Sets the current scope, overriding any properties of the same name.
  ctx.scope({
    value: 5,
  });

  // Retrieves the current scope:
  const scope = ctx.scope(); // { value: 5 }

  // Better to be explicit?
  ctx.setScope({ value: 5 });
  ctx.getScope();
  // or
  ctx.scope.set({ value: 5 });
  ctx.scope.get();

  // Could even just be an object (or getter/setter if need be)
  ctx.scope = {
    value: 5,
  };

  return h(Sub);
}

function Sub(ctx, h) {
  // Retrieves the scope which contains merged values from superview scopes.
  const { value } = ctx.scope();

  return h("h1", `Value is: ${value}`);
}
```

## What does this solve?

State you want to share widely among some subtree of components, but you don't really want to put it all the way up in a global. Basically it adds a third "plane" for state to exist in an app; local/attributes, scope, and global.

- Use local to track state that effects only the view it's in, or at most, direct super- or subviews through the passing of attributes.
- Use scope for state that is heavily used in many layers of subviews, but irrelevant outside the view that defines it.
- Use global for state that is heavily used across the app.

Kind of the same idea as React contexts: https://reactjs.org/docs/context.html
