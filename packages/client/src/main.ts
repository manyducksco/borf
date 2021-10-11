// export * from "./State";

import { State } from "./State/index.js";
import { div, ul, li, map, when, text } from "./elements/index.js";

const root = document.getElementById("root");

if (root) {
  const counter = new State({
    count: 0,
  });

  const component = div({
    children: [
      text(
        counter
          .map("count", (n) => `you have pressed enter ${n} times`)
          .subscribe()
      ),
    ],
  });

  counter.subscribe("count", (value) => {
    console.log("count: ", value);
  });

  window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "enter") {
      counter.set("count", counter.current.count + 1);
    }
  });

  component.mount(root);

  console.log("test");
}

console.log("whatever");
