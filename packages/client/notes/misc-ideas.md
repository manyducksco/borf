## Misc Ideas

### AttrTypes

Like PropTypes in React. Actual attributes will be validated against this structure any time they change while in development mode. Throws a descriptive error if the value doesn't match.

```js
import { AttrTypes } from "@woofjs/client";

function Component() {
  // Error is thrown if at any point `value` is not a string.
  const $value = this.$attrs.map("value");

  return <div>{$value}</div>;
}

Component.attrTypes = {
  value: AttrTypes.string.isRequired,
  object: AttrTypes.shape({
    id: AttrTypes.number.isRequired,
    url: AttrTypes.custom(({ value }) => {
      if (!/^https?:\/\//.test(value)) {
        return "Expected a URL";
      }
    }),
    category: AttrTypes.oneOf("One", "Two"),
    data: AttrTypes.oneOfType(AttrTypes.string, AttrTypes.number),
    list: AttrTypes.array,
    detailedList: AttrTypes.arrayOf("One", "Two"),
    dataList: AttrTypes.arrayOfType(AttrTypes.string, AttrTypes.number),
  }),
};
```

### makeStore

> IMPLEMENTED

```js
import { makeStore } from "@woofjs/client";

// Contents are stored in localStorage with this key.
// Values persist between page reloads.
const $state = makeStore("some-name");

// Showing all arguments. Uses sessionStorage if session: true
const $state = makeStore("key", defaultValue, { session: true });
```

### Drag and Drop

Well, I don't know what this idea would be, but there definitely needs to be a way to wrap the drag and drop API to make it easier to use. Raw drag and drop is a bit rough.
