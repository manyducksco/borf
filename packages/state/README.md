# @woofjs/state

> These functions are also exported from `@woofjs/app`. This package is a standalone version.

```
$ npm i --dev @woofjs/state
```

## The Basics

```js
import { makeState } from "@woofjs/state";

// Create a new state with a value of 5
const $count = makeState(5);

$count.get(); // returns 5
$count.set(10); // value of $count is now 10

const unwatch = $count.watch((value) => {
  console.log(value); // Prints the value each time $count is set
});

unwatch(); // Stop watching

// Create a new state that updates whenever $count does
const $doubled = $count.map((n) => n * 2);

$doubled.get(); // returns 20
// There is no $doubled.set() because $doubled gets its value from $count

// Setting the original state updates mapped states
$count.set(7);

$count.get(); // returns 7
$doubled.get(); // returns 14
```

## Click Counter Example

Everyone loves a good click counter. Useless in real life but great for showing how a state library works.

### makeState + HTML

A basic example with `makeState` and typical browser stuff.

```html
<main>
  <p>Clicked <span id="label">0</span> time(s).</p>
  <br />
  <button id="increment">+1</button>
  <button id="decrement">-1</button>
</main>

<script type="module">
  import { makeState } from "https://cdn.skypack.dev/@woofjs/state";

  const label = document.getElementById("label");
  const increment = document.getElementById("increment");
  const decrement = document.getElementById("decrement");

  const $count = makeState(0);

  $count.watch((value) => {
    label.textContent = value.toString();
  });

  increment.addEventListener("click", () => {
    $count.set((current) => current + 1);
  });
  decrement.addEventListener("click", () => {
    $count.set((current) => current - 1);
  });
</script>
```

### Woof + JSX

A state is useful on its own, but its day job is to be the backbone of reactivity in a framework called Woof. This is what the same example looks like in Woof.

We have basically copied that `<main>` block into a chunk of JavaScript and removed most of the code for binding data and events.

`$.text()` takes `$count` and renders its current value into the DOM as text. Event handler functions are passed directly to the buttons.

```js
import { Component, makeState } from "@woofjs/app";

class Counter extends Component {
  createElement($) {
    const $count = makeState(0);

    return (
      <main>
        <p>Clicked {$.text($count)} time(s).</p>
        <br />
        <button onclick={() => $count.set((current) => current + 1)}>+1</button>
        <button onclick={() => $count.set((current) => current - 1)}>-1</button>
      </main>
    );
  }
}
```

That `time(s)` label is kind of basic. To overcomplicate things, let's add a dynamic label based on the value of `$count`.

Now our label reads:

- Clicked 0 times.
- Clicked 1 time.
- Clicked 2 times.
- ...

```js
import { Component, makeState } from "@woofjs/app";

class Counter extends Component {
  createElement($) {
    const $count = makeState(0);

    const $times = $count.map((current) => {
      if (current === 1) {
        return "time";
      } else {
        return "times";
      }
    });

    return (
      <main>
        <p>
          Clicked {$.text($count)} {$.text($times)}.
        </p>
        <br />
        <button onclick={() => $count.set((current) => current + 1)}>+1</button>
        <button onclick={() => $count.set((current) => current - 1)}>-1</button>
      </main>
    );
  }
}
```

[Read more about Woof...]()

## API

### `makeState`

```js
import { makeState } from "@woofjs/state";

const $state = makeState("🤷‍♂️");
```

Here are all the functions you'll find on a state and how to call them:

- `.get` for getting the current value
  - `.get()` to get the current value
  - `.get("some.key")` to get a nested part of the current value &ndash; works when the value is an object
- `.set` for updating the current value
  - `.set(newValue)` to set a new value
  - `.set(current => newValue)` to replace the current value by returning a new one
  - `.set(current => {})` to update the current value by mutating it ([produces a new value behind the scenes](https://immerjs.github.io/immer/))
- `.map` for deriving new states from this state
  - `.map()` to create a read-only copy of this state
  - `.map(current => newValue)` to make a state with `newValue` from this state's `current` value
  - `.map("some.key")` to make a new state out of a nested part of this state's value &ndash; equivalent to `.map(current => current.some.key)`
  - `.map("some.key", selected => newValue))` to make a new state out of a nested part of this state's value, as returned from a mapping function
- `.watch` for observing changes to this state
  - `.watch(current => {})` to watch for new values whenever the state is set &ndash; returns an `unwatch()` function
  - `.watch("some.key", selected => {})` to watch for changes to a nested part of the state's value &ndash; returns an `unwatch()` function
  - one of the following...
    - `.watch(current => {}, options)`
    - `.watch("some.key", selected => {}, options)`
    - ...where `options` is an object with these properties
      - `.immediate` (boolean) if true, call the watch function once with the current value
- `.toString()` to get the current value as a string

A state produced by `.map()` supports everything aside from `.set()` (because mapped states derive their values from the original state).

[See test suite for code examples](./makeState.test.js)<br>
[See implementation](./makeState.js)

### `mergeStates`

```js
import { mergeStates } from "@woofjs/state";

const $isLoading = makeState(true);
const $hasData = makeState(false);

const $isReady = mergeStates($isLoading, $hasData, (isLoading, hasData) => {
  return hasData && !isLoading;
});
```

[See test suite for code examples](./mergeStates.test.js)<br>
[See implementation](./mergeStates.js)

---

[🦆](https://www.manyducks.co)
