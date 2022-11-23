## Poll States

Readable states that take their value by polling. Only actually polls while it has at least one subscriber.

This might be a dumb idea as I don't actually have a real use case for it. I can imagine a hypothetical scenario where you might need to have something dynamically respond to a value that doesn't implement the Observable protocol.

```js
import { h } from "@woofjs/client";

function Sub(ctx, h) {
  // Creates a poll state which runs a callback every x milliseconds
  // and takes its return value, broadcasting when the value changes.
  const $value = makePollState(50, () => {
    return someCalculatedOrOtherwiseNonObservableValue;
  });

  return h("h1", `Value is: ${$value}`);
}
```
