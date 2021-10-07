# States

Manage state with subscriptions, undo and redo.

```js
import { states } from "*";

// create a state container
const state = states.create({
  count: 0,
});

// listen for changes on a certain key
state.subscribe("count", (value) => {
  console.log(`counted to ${value}`);
});

for (let i = 0; i < 5; i++) {
  // set state to trigger subscribers
  state.set("count", state.current.count + 1);
}

// undo and redo state changes and trigger subscribers
state.undo(2); // two steps back
state.redo(); // one step forward

// the subscriber above will print the following messages (annotations excluded):

// 'counted to 1' (begin loop)
// 'counted to 2'
// 'counted to 3'
// 'counted to 4'
// 'counted to 5' (end loop)
// 'counted to 3' (undo 2)
// 'counted to 4' (redo)
```
