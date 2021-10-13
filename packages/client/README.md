# Web Framework

A not-yet-named web framework with these goals:

- Made up of individual tools that compose well together
- Doesn't require any transpiling or build system
- Runs the minimal amount of logic to get the job done (including DOM updates)

## TODO

Utilities

- Function to set page title
- HTTP request wrapper with built in auth and parsing

Extras

- Add a toast notification system (accessible)
- Add a modal component (accessible)
- Add consistently designed input components (accessible)
  - date / time / datetime picker (with time zone support)

## Test

```js

```

## Naming

Receptor?

Call a subscription a receptor instead. Use the biology metaphor. The central idea is sending and receiving things. Elements are for setting up the DOM to receive new data. Pipes are for sending and receiving across the app, or between client and server, or server and server. I want to see how many things I can apply this send/receive pattern to.

```js
// get an instance
const receptor = state.receive("items");

// define a handler
state.receive("items", (value) => {
  // ...
});

// text receives the title when it changes
h1({ children: [text(state.receive("title"))] });

// input is bound and will update state when it changes
input({
  type: "text",
  value: state.bind("title"),
});

// receive from a Pipe
pipe.receive((value) => {
  console.log(value);
});

pipe.send(value, (response) => {
  // send data and process replies
});

pipe.receive((value, reply) => {});
```
