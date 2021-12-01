# State

## Getter and setter

Calling `state()` gets you a state getter/setter.

```js
const value = state(5);

value(); // getter: returns 5
value(7); // setter: sets value to 7
```

## Listening for changes

When called with a function, that function will receive all new values until you cancel the listener.

```js
// listen for changes
const cancel = value((updated) => {
  console.log("updated value: " + updated);
});

// stop listening
cancel();

// cancel from within a listener
value((updated, cancel) => {
  console.log("updated value: " + updated);

  if (updated === 10) {
    cancel(); // stop listening when value is set to 10
  }
});
```

Use this context pattern to collect multiple listeners and cancel them all at once.

```js
const context = {
  cancellers: [],
  cancel() {
    for (const cancel of this.cancellers) {
      cancel();
    }
    this.cancellers = [];
  }
}

// cancel functions are added to the `context.cancellers` array
// `context` can be any object with a `cancellers` array
value(context, (updated) => {
  console.log("updated value 1: " + updated);
});

value(context, (updated) => {
  console.log("updated value 2: " + updated);
});

value(context, (updated) => {
  console.log("updated value 3: " + updated);
});

context.cancel(); // cancels all three listeners
```

## Mapping values from one state into another

```js
const value = state("hello");
const louder = state.map(value, v => v.toUpperCase());

louder(); // returns "HELLO"
```

## Composing multiple states

Pass any number of states plus a function to resolve a new value given the existing states.

```js
const one = state(true);
const two = state(false);

const bothTrue = state.combine(one, two, (one, two) => one && two);
```