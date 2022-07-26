# @woofjs/jss

CSS-in-JS for Woof components.

```js
import { makeStyleSheet } from "@woofjs/jss";

function Component() {
  const classes = makeStyleSheet(this, {
    text: {
      fontSize: 14,
      color: "red",
      "&:hover": {
        color: "blue",
      },
    },
  });

  return <p class={classes.text}>This text is red, but blue when you hover it.</p>;
}
```

---

🦆
