// export * from "./State";

export * from "./Sender";

import { operators, Sender } from "./Sender";

import { State } from "./State";
import { div, ul, li, map, when, text, button } from "./elements";

class StateSender<T> extends Sender<T> {
  #value: T;

  get current() {
    return this.#value;
  }

  constructor(initialState: T) {
    super();
    this.#value = initialState;
  }

  set(value: T) {
    if (value !== this.#value) {
      this.#value = value;
      this._send(value);
    }
  }
}

const counter = new State({
  count: 0,
});
const increment = () => counter.set("count", counter.current.count + 1);
const decrement = () => counter.set("count", counter.current.count - 1);
const label = counter.map("count", (n) => `the number is: ${n}`);

// const counter = new StateSender(0);
// const increment = () => counter.set(counter.current + 1);
// const decrement = () => counter.set(counter.current - 1);
// const label = operators.map(counter.receive(), (n) => `the number is: ${n}`);

const component = div({
  children: [
    text(label.subscribe()),
    button({
      onClick: increment,
      children: [text("Increment")],
    }),
    button({
      onClick: decrement,
      children: [text("Decrement")],
    }),
  ],
});

counter.subscribe("count", (value) => {
  console.log("count: ", value);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") {
    increment();
  } else if (e.key === "ArrowDown") {
    decrement();
  }
});

component.mount(document.getElementById("root")!);
