// export * from "./State";

export * from "./Sender";

import { State } from "./Sender";
import {
  $map,
  $when,
  $text,
  div,
  ul,
  li,
  input,
  button,
  p,
  span,
} from "./elements";
import { StateTransmitter } from "./Sender/StateTransmitter";

/*===========================*\
||        Class Toggle       ||
\*===========================*/

class ToggleState extends State<boolean> {
  toggle() {
    this.set(!this.current);
  }
}

function classToggleExample() {
  const active = new ToggleState(false);
  const status = active.map((active) => (active ? "ON" : "OFF"));

  setInterval(() => {
    active.toggle();
  }, 2000);

  return div({
    class: {
      example: true,
      active: active,
    },
    children: [$text(status)],
  });
}

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

function counterExample() {
  const counter = new CounterState(0);
  const label = counter.map((n) => ` the number is: ${n}`);

  return div({
    class: ["example", "two"],
    children: [
      button({
        onClick() {
          counter.increment();
        },
        children: [$text("Increment")],
      }),
      button({
        onClick() {
          counter.decrement();
        },
        children: [$text("Decrement")],
      }),
      $text(label),
    ],
  });
}

/*===========================*\
||      Two Way Binding      ||
\*===========================*/

function twoWayBindExample() {
  const name = new State("");
  const age = new State(18);

  name.receive(console.log);
  age.receive(console.log);

  return div({
    class: ["example", { three: true }],
    children: [
      p({ children: [$text(name, "Type Below")] }),
      input({
        value: name.bind(),
        // placeholder: "Name"
      }),
      input({
        type: "number",
        value: age.bind(),
      }),
    ],
  });
}

/*===========================*\
||   Conditional Rendering   ||
\*===========================*/

function conditionalExample() {
  const show = new ToggleState(false);
  const label = show.map((visible) => (visible ? "Hide Text" : "Show Text"));

  return div({
    class: ["example", "four"],
    children: [
      button({
        onClick() {
          show.toggle();
        },
        children: [$text(label)],
      }),
      $when(
        show,
        span({
          onMount() {
            console.log("text was mounted");
          },
          onUnmount() {
            console.log("text was unmounted");
          },
          children: [$text(" Hello there!")],
        })
      ),
    ],
  });
}

/*===========================*\
||      Rendering Lists      ||
\*===========================*/

function mapExample() {
  const list = new State<string[]>(["initial", "items"]);

  setInterval(() => {
    const newList = list.current.filter(() => Math.random() > 0.5);

    for (let i = 0; i < 10 - newList.length; i++) {
      newList.push((Math.random() * 1000).toString(16));
    }

    list.set(newList);
  }, 2000);

  return div({
    class: ["example", "five"],
    children: [
      $map(
        list,
        (x) => x,
        (value) => li({ children: [$text(value)] })
      ),
    ],
  });
}

/*===========================*\
||       Mouse Follower      ||
\*===========================*/

interface MouseInfo {
  x: number;
  y: number;
}

class MouseState extends StateTransmitter<MouseInfo> {
  constructor() {
    super({ x: 0, y: 0 });

    window.addEventListener("mousemove", (e) => {
      this._set({
        x: e.pageX,
        y: e.pageY,
      });
    });
  }
}

// every X ms pass the function the old state and take its return value as the next state
// const num = new TickState(1, 300, (n) => n + 1);

function mouseFollowerExample() {
  const mouse = new MouseState();
  const backgroundColor = new State("#ff0088");
  const delay = new State<number>(50);
  const transform = mouse
    .delay(delay)
    .map((m) => `translate(${m.x}px, ${m.y}px)`);

  function setRandomColor() {
    const hex = [Math.random() * 256, Math.random() * 256, Math.random() * 256]
      .map(Math.floor)
      .map((n) => n.toString(16))
      .join("");

    backgroundColor.set("#" + hex);
  }

  // backgroundColor.receive(console.log);
  // delay.receive(console.log);

  return div({
    class: ["example", "mouse-follower"],
    children: [
      div({
        class: "follower",
        style: {
          transform,
          backgroundColor,
        },
      }),
      input({
        type: "range",
        min: 0,
        max: 300,
        step: 1,
        value: delay.bind(), // value bind automatically converts value back to the initialValue's type
      }),
      $when(
        backgroundColor.map((x) => x !== "#ff0088"),
        button({
          onClick: () => backgroundColor.set("#ff0088"),
          children: [$text("Reset To Best Color")],
        })
      ),
      button({
        onClick: setRandomColor,
        children: [$text("Change Follower Color")],
      }),
    ],
  });
}

/*===========================*\
||           Render          ||
\*===========================*/

const component = div({
  children: [
    classToggleExample(),
    counterExample(),
    twoWayBindExample(),
    conditionalExample(),
    // mapExample(),
    mouseFollowerExample(),
  ],
});

component.mount(document.getElementById("root")!);
