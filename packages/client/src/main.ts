// export * from "./State";

export * from "./Sender";

import { State } from "./Sender";
import { div, ul, li, map, input, when, text, button } from "./elements";

/*===========================*\
||        Class Toggle       ||
\*===========================*/

class ToggleState extends State<boolean> {
  toggle() {
    this.set(!this.current);
  }
}

const active = new ToggleState(false);
const status = active.map((active) => (active ? "ON" : "OFF"));

setInterval(() => {
  active.toggle();
}, 1000);

const classToggleExample = div({
  class: {
    example: true,
    active: active.subscribe(),
  },
  children: [text(status.subscribe())],
});

/*===========================*\
||       Counter + Map       ||
\*===========================*/

class CounterState extends State<number> {
  increment() {
    this.set(this.current + 1);
  }

  decrement() {
    this.set(this.current - 1);
  }
}

const counter = new CounterState(0);
const label = counter.map((n) => `the number is: ${n}`);

const counterExample = div({
  class: ["example", "two"],
  children: [
    button({
      onClick: () => counter.increment(),
      children: [text("Increment")],
    }),
    button({
      onClick: () => counter.decrement(),
      children: [text("Decrement")],
    }),
    text(label.subscribe()),
  ],
});

/*===========================*\
||      Two Way Binding      ||
\*===========================*/

const name = new State("");

name.receive(console.log);

const twoWayBindExample = div({
  class: ["example", { three: true }],
  children: [
    input({
      value: name.bind(),
    }),
  ],
});

/*===========================*\
||      Two Way Binding      ||
\*===========================*/

// const list = new State<string[]>(["initial", "items"]);

// setInterval(() => {
//   const newList = [];

//   for (let i = 0; i < 10; i++) {
//     newList.push((Math.random() * 1000).toString(16));
//   }

//   list.set(newList);
// }, 2000);

// const listMapExample = div({
//   class: ["example", "four"],
//   children: [
//     map(
//       list.subscribe(),
//       (x) => x,
//       (value) => {
//         return li({ children: [text(value)] });
//       }
//     ),
//   ],
// });

/*===========================*\
||           Render          ||
\*===========================*/

const component = div({
  children: [
    classToggleExample,
    counterExample,
    twoWayBindExample,
    // listMapExample,
  ],
});

component.mount(document.getElementById("root")!);
