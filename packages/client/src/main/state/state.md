# State

## Getter and setter

Calling `makeState()` gets you a state container.

```js
const counter = makeState(5, {
  // disables .set() function, throwing an error when called
  // non-settable states can only be modified with methods
  settable: false,
  methods: {
    // Methods take the current value followed by any args passed to the methods when called.
    // They return the state's new value. Methods cannot be named 'get', 'set', 'watch', or 'map'
    // to avoid conflicts with built in methods.
    add(current, amount = 1) {
      return current + amount;
    },
    subtract(current, amount = 1) {
      return current - amount;
    },
  },
});

// Standard methods
counter.get();
counter.set(10); // Throws error when settable=false
const cancel = counter.watch((value) => {
  console.log(value);
});
const doubled = counter.map((n) => n * 2); // Creates new state with each value transformed by a function

// Custom methods (works even with settable=false)
counter.add(5);
counter.subtract(3);
```

## Listening for changes

When called with a function, that function will receive all new values until you cancel the listener.

```js
// watch for changes
const cancel = state.watch((value) => {
  console.log("updated value: " + value);
});

// stop listening
cancel();
```

## Mapping values from one state into another

```js
const greeting = makeState("hello");
const louder = greeting.map((value) => value.toUpperCase());

louder.get(); // returns "HELLO"

greeting.set("please stop yelling");

louder.get(); // returns "PLEASE STOP YELLING"
```

## Composing multiple states

Pass any number of states followed by a function. This function takes all values in the order the states were passed, and whatever value the function returns becomes the value of the combined state.

```js
const one = makeState(true);
const two = makeState(false);

const bothTrue = combineStates(one, two, (v1, v2) => v1 && v2);
```

## State methods

States can provide methods for working with the data they hold. Methods take the current value and return a new value.

```js
const count = makeState(5, {
  methods: {
    increment: (current) => current + 1,
    decrement: (current) => current - 1,
  },
});

count.increment(); // now 6
count.increment(); // now 7
count.decrement(); // now 6
```

A state method takes the current value as the first argument, followed by any arguments you pass to the method when it is called. Methods work even on an immutable state, so you can use them to control how your state can be modified.

```js
const defaults = {
  name: "Siri Keeton",
  age: 32,
  profession: "Synthesist",
};

const form = makeState(defaults, {
  settable: false,
  methods: {
    setName: (current, value) => {
      current.name = value;
    },
    setProfession: (current, value) => {
      current.profession = value;
    },
  },
});

form.setName("Dan Brüks");
form.setProfession("Biologist");
```

The form defined above provides no way to change the age, but gives controlled ways to set the values we want to expose. Methods use [immer](https://immerjs.github.io/immer/) under the hood, so it's safe to mutate the `current` value because it will result in a new state without actually touching the existing one.
