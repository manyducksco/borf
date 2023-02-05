# Naming of 'attrs'

I don't like 'attrs' because it's an abbreviation. I think a full word would look better. Possible alternatives:

- attrs (current; abbreviation, not a big fan)
- attributes (good but feels a little long to type out, aligns with HTML terms)
- props (still an abbreviation, but familiar to react users)
- properties (meaningless word like 'component' or 'module')
- inputs (shorter and explicit about where they come from; aesthetically pleasing and easy to think about)
- fields (kind of odd)
- bindings (maybe?)

```jsx
class Example extends View {
  static inputs = {
    value: {
      type: "string",
    },
  };

  setup(ctx, m) {
    const $value = ctx.inputs.readable("value");

    return <h1>{$value}</h1>;
  }
}
```
