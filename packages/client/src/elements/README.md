# Elements

Build a UI with DOM elements and reactive state.

```js
import { elements, states } from "*";

const { h1, form, div, label, input, ul, li } = elements;

function createForm() {
  const state = states.create({
    firstName: "",
    lastName: "",
    errors: [],

    // computed property that changes when 'firstName' or 'lastName' changes. new value is returned by the function.
    $fullName: ["firstName", "lastName", (first, last) => `${first} ${last}`],

    $hasErrors: ["errors", (errors) => errors.length > 0],
  });

// This is the shape of a subscription object (one way data binding)
  const subscription = {
    receiver: (value) => {},
    cancel()
  }

// This is the shape of a binding object (two way data binding)
  const binding = {
    receiver: (value) => {},
    set(value)
    cancel(),
  }

  // Bind a key to get a binding object
  const firstName = state.bind("firstName")

  firstName.set("new first name")

  // idea: computed subscriptions that update when any of their dependency values change.
  const fullName = state.derive( // 'derive', 'compute', ?
    ["firstName", "lastName"],
    (first, last) => `${first} ${last}`
  );

  const $hasErrors = state.compute("errors", (errors) => errors.length > 0);

  return form({
    // always include '.name-form' but only include '.has-errors' if 'invalid' state is true
    class: [
      "name-form",
      {
        "has-errors": state.subscribe("$hasErrors"),
      },
    ],

    onSubmit(e) {
      e.preventDefault();
      console.log(state.current);
    },

    style: {
      border: "1px solid orange",
      borderRadius: 8,
    },

    children: [
      h1({ children: [elements.text(fullName.subscribe())] }),
      div({
        class: "input-group",
        children: [
          label({ for: "first-name" }),
          input({
            type: "text",
            name: "first-name",
            value: state.subscribe("firstName"), // TODO: store current value on subscription so element can get initial value
            onChange(e) {
              state.set("firstName", e.target.value);
            },
          }),
        ],
      }),

      ul({
        // 'elements.map' maintains a list that changes whenever the subscribed list gets a new value.
        children: elements.map(state.subscribe("errors"), (err) =>
          li({ class: ["list-item", "border"], children: err.message })
        ),
      }),
    ],
  });
}
```
