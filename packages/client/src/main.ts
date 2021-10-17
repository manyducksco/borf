// export * from "./State";

export * from "./Sender";

import { State } from "./Sender";
import { div, ul, li, map, input, when, text, button } from "./elements";

class ToggleState extends State<boolean> {
  toggle() {
    this.set(!this.current);
  }
}

class CounterState extends State<number> {
  increment() {
    this.set(this.current + 1);
  }

  decrement() {
    this.set(this.current - 1);
  }
}

/*===========================*\
||        Class Toggle       ||
\*===========================*/

const active = new ToggleState(false);

setInterval(() => {
  active.toggle();
}, 1000);

const classToggleExample = div({
  class: {
    example: true,
    active: active.subscribe(),
  },
});

/*===========================*\
||       Counter + Map       ||
\*===========================*/

const counter = new CounterState(0);
const label = counter.map((n) => `the number is: ${n}`);

const counterExample = div({
  children: [
    text(label.subscribe()),
    button({
      onClick: counter.increment,
      children: [text("Increment")],
    }),
    button({
      onClick: counter.decrement,
      children: [text("Decrement")],
    }),
  ],
});

/*===========================*\
||      Two Way Binding      ||
\*===========================*/

const name = new State("");

name.receive(console.log);

const twoWayBindExample = div({
  children: [
    input({
      value: name.bind(),
    }),
  ],
});

/*===========================*\
||           Render          ||
\*===========================*/

const component = div({
  children: [classToggleExample, counterExample, twoWayBindExample],
});

component.mount(document.getElementById("root")!);
