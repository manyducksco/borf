// export * from "./State";

import { State } from "./State";
import { div, ul, li, map, when, text, button } from "./elements";

const counter = new State({
  count: 0,
});

const label = counter.map("count", (n) => `the number is: ${n}`);

const increment = () => {
  counter.set("count", counter.current.count + 1);
};

const decrement = () => {
  counter.set("count", counter.current.count - 1);
};

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
