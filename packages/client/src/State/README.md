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

## Idea: FormState

```js
const form = new FormState({
  // initial values
  fields: {
    firstName: "Tom",
    lastName: "Jones",
    age: 37,
    skill: "intermediate",
  },

  // user friendly names for each field to be used for error messages
  // accessible at 'form.fieldNames'
  fieldNames: {
    firstName: "First name",
    lastName: "Last name",
    age: "Age",
    skill: "Skill",
  },

  // validators mirror fields
  // the same named validator is called (if defined) every time a key changes
  // if the function returns a string it's added to the form's errors
  // if the function returns null or undefined the value is considered valid
  //
  validate: {
    firstName: (value) => {
      if (typeof value !== "string") {
        return "must be a string";
      }

      if (value.length > 50) {
        return "must be 50 characters or less";
      }

      if (/[!@#$%^&*]/.test(value) == false) {
        return "must contain at least one special character";
      }

      // don't return a string to consider valid
    },

    // possible validators utility
    // this would do the same as the above
    lastName: V.string()
      .maxLength(50)
      .pattern(/[!@#$%^&*]/, "must contain at least one special character"),

    // .optional() allows both null and undefined
    // this chain assumes after .number() that null/undefined are not allowed unless you use .optional()
    age: V.number().integer().greaterThan(13).lessThanOrEqualTo(120).optional(),

    // use '.assert(condition, message)' where condition returning true is considered valid
    // returns the message as an error otherwise
    age: V.assert((value) => typeof value === "number", "must be a number"),

    // compare against literal values
    skill: V.oneOf("beginner", "intermediate", "expert"),

    // 'any' takes one or more functions and is considered valid if any function returns a null or undefined against the current value
    skill: V.any(V.string(), V.number().float().between(1.5, 62)),

    // optional object that, if defined, must have a firstName but doesn't need to have a lastName
    // other properties not listed here are not allowed
    object: V.object({
      firstName: V.string(),
      lastName: V.string().optional()
    }).optional()
  },
});

// the usual interface
form.current;
form.set({ firstName: "Bob" });
form.receive("lastName", (value) => {
  // ...
});
form.bind("firstName");

form.isValid; // false if any validators returned an error
form.hasValid("firstName"); // false if validator returned an error with current value and true otherwise

form.errors.current; // array of errors like below
[
  { key: "firstName", message: "must be 50 characters or less" },
  { key: "skill", message: "must be one of: beginner, intermediate, expert" },
];
// errors for a key are cleared when it is changed

// idea for polling receiver
// receives new value if function returns a different value since last poll
// this one is polling by calling the function every 50ms
const receiver = poll(() => form.errors, 50);
receiver.cancel(); // stops polling

const mapped = map(receiver, value => /* return derived value */);

const filtered = filter(receiver, value => /* return true or false */);

// send as array when received messages accumulate to 5, or when there is at least one message and 2000 milliseconds have elapsed since the last send
const batched = batch(receiver, 5, 2000);

// sends only the latest message received within a 300ms window since the last message was sent
const debounced = debounce(receiver, 300);

// create a receiver for a DOM event where the receiver function is the handler
const receiver = receiveEvent(domNode, "name");

// broadcast a single receiver to create multiple receivers out of it
// like a radio station having an album and playing it for many listeners
const broadcaster = broadcast(receiver);

broadcaster.current // has current polled value at the moment
broadcaster.receive() // returns new receiver

// TODO: need a way to subscribe to a list of errors or just one
// syntax for doing this is kind of weird

// TODO: support nested selectors and receivers? like "person.lastName"

// get a receiver and render the errors using a map element
ul({
  children: [
    map(form.errors.subscribe(), "key", (error) =>
      li({ children: [text(`${form.fieldNames[error.key]} ${error.message}`)] })
    ),
    when(
      form.errors.subscribe("firstName")
      text(form.errors.subscribe("firstName"))
    ),
  ],
});
```
