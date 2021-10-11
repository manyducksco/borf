# State

Manage state with subscriptions, undo and redo.

Problems being solved:

- Group state together in a dedicated container
- Enable watching of state and reacting when it changes
- Enable two-way data binding
- Support undo out of the box (hard to implement correctly)

```js
// create a state container
const state = new State({
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

Subscriptions are one way observers. For two way binding there are Bindings, which add an additional 'set' method:

```js
const state = new State({
  count: 0,
});

const binding = state.bind("count", (value) => {
  console.log(`counted to ${value}`);
});

// These calls do the same thing:
binding.set(binding.current + 1);
state.set("count", state.current.count + 1);
```

You can also derive a new value from one or more keys with the 'derive' function. This is sometimes called a computed property.

```js
const state = new State({
  count: 1,
  multiplier: 2,
});

// Double 'count' when it changes
const doubled = state.map("count", (count) => count * 2);

console.log(doubled.current); // 2
doubled.subscribe(); // get a subscription to the derived value; used just like a standard state sub

// Derive from multiple keys
const multiplied = state.map(
  ["count", "multiplier"],
  (count, multiplier) => count * multiplier
);
```
