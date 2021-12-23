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

Use the context pattern to collect multiple listeners and cancel them all at once.

```js
const context = {
  cancellers: [],
  cancelAll() {
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

context.cancelAll(); // cancels all three listeners
```

## Mapping values from one state into another

```js
const value = state("hello");
const louder = state.map(value, v => v.toUpperCase());

louder(); // returns "HELLO"

value("please stop yelling");

louder(); // returns "PLEASE STOP YELLING"
```

## Composing multiple states

Pass any number of states followed by a function. This function takes all values in the order the states were passed, and whatever value the function returns becomes the value of the combined state.

```js
const one = state(true);
const two = state(false);

const bothTrue = state.combine(one, two, (one, two) => one && two);
```

## State methods

States can provide methods for working with the data they hold. Methods take the current value and return a new value.

```js
const value = state(5, {
  methods: {
    increment: (current) => current + 1,
    decrement: (current) => current - 1
  }
});

value.increment(); // now 6
value.increment(); // now 7
value.decrement(); // now 6
```

A state method takes the current value as the first argument, followed by any arguments you pass to the method when it is called. Methods work even on an immutable state, so you can use them to control how your state can be modified.

```js
const defaults = {
  name: "Siri Keeton",
  age: 32,
  profession: "Synthesist"
}

const form = state(defaults, {
  immutable: true,
  methods: {
    setName: (current, value) => {
      current.name = value;
    },
    setProfession: (current, value) => {
      current.profession = value;
    }
  }
});

form.setName("Dan Brüks");
form.setProfession("Biologist");
```

The form defined above provides no way to change the age, but gives controlled ways to set the values we want to expose. Methods use [immer](https://immerjs.github.io/immer/) under the hood, so it's safe to mutate the `current` value because it will result in a new state without actually touching the existing one.