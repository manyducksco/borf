Keyboard shortcuts

```js
import { Keys } from "***";

// keys can be bound on the global instance with the following functions
const unbind = Keys.onDown("v", () => {}); // fires on keydown
const unbind = Keys.onUp("x", () => {}); // fires on keyup

unbind(); // unbinds the single binding

Keys.unbind(); // unbinds all global and layer bindings

// keys can be bound and unbound as a group using layers
// layers do not bind until you call the .bind() function manually
const layer = Keys.createLayer()
  .onDown("a", () => {
    // do something when a is pressed
  })
  .onUp("shift+b", () => {
    // do something when shift+b is released
  });

layer.bind();
layer.unbind();
```
