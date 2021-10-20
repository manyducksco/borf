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
  h3,
} from "./elements";
import { Component, ElementClasses } from "./elements/BaseComponent";
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
  const text = new State("");
  const size = new State(18);

  text.receive(console.log);
  size.receive(console.log);

  return div({
    class: ["example", { three: true }],
    children: [
      input({
        value: text.bind(),
      }),
      input({
        type: "number",
        value: size.bind(),
      }),

      p({
        children: [$text(text, "Type Above")],
        style: {
          fontSize: size.map((s) => `${s}px`),
        },
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

// TODO: Implement 'sort' as a transform function
function mapExample() {
  const list = new State<string[]>(["apple", "banana", "orange", "唐揚げ"]);

  return div({
    class: ["example", "five"],
    children: [
      button({
        onClick() {
          list.set(list.current.map((x) => x).sort());
        },
        children: [$text("Sort A to Z")],
      }),
      button({
        onClick() {
          list.set(
            list.current
              .map((x) => x)
              .sort()
              .reverse()
          );
        },
        children: [$text("Sort Z to A")],
      }),
      $map(
        list,
        (x) => x,
        (item) =>
          li({
            onClick() {
              alert(item);
            },
            children: [$text(item)],
          })
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
  paused: boolean = false;

  constructor() {
    super({ x: 0, y: 0 });

    window.addEventListener("mousemove", (e) => {
      if (!this.paused) {
        this._set({
          x: e.pageX,
          y: e.pageY,
        });
      }
    });
  }
}

// every X ms pass the function the old state and take its return value as the next state
// const num = new TickState(1, 300, (n) => n + 1);

function mouseFollowerExample() {
  const enabled = new ToggleState(false);
  const mouse = new MouseState();
  const backgroundColor = new State("#ff0088");
  const delay = new State(50);
  const throttle = new State(50);
  const transform = mouse
    .delay(delay)
    .throttle(throttle)
    .map((m) => `translate(${m.x}px, ${m.y}px)`);

  mouse.paused = !enabled.current;

  // pause mouse listener when disabled
  enabled.receive((value) => {
    mouse.paused = !value;
  });

  function setRandomColor() {
    const hex = [Math.random() * 256, Math.random() * 256, Math.random() * 256]
      .map(Math.floor)
      .map((n) => n.toString(16))
      .join("");

    backgroundColor.set("#" + hex);
  }

  // backgroundColor.receive(console.log);
  // delay.receive(console.log);

  return exampleSection({
    class: ["mouse-follower"],
    children: [
      // TODO: Optimize - unsubscribe while component is not mounted
      $when(
        enabled,
        div({
          class: "follower",
          style: {
            transform,
            backgroundColor,
          },
        })
      ),
      div({
        class: "input-group",
        children: [
          h3({ children: [$text(delay.map((n) => `Delay (${n}ms)`))] }),
          input({
            type: "range",
            min: 0,
            max: 300,
            step: 1,
            value: delay.bind(), // value bind automatically converts value back to the initialValue's type
          }),
        ],
      }),
      div({
        class: "input-group",
        children: [
          h3({ children: [$text(throttle.map((n) => `Throttle (${n}ms)`))] }),
          input({
            type: "range",
            min: 0,
            max: 300,
            step: 1,
            value: throttle.bind(), // value bind automatically converts value back to the initialValue's type
          }),
        ],
      }),
      $when(
        backgroundColor.map((x) => x !== "#ff0088"),
        button({
          onClick: () => backgroundColor.set("#ff0088"),
          disabled: enabled.map((x) => !x),
          children: [$text("Reset To Best Color")],
        })
      ),
      button({
        onClick: setRandomColor,
        children: [$text("Change Follower Color")],
        disabled: enabled.map((x) => !x),
      }),
      button({
        onClick: () => enabled.toggle(),
        children: [
          $text(
            enabled.map((x) => (x ? "Turn Off Follower" : "Turn On Follower"))
          ),
        ],
      }),
    ],
  });
}

interface ExampleSectionProps {
  class?: ElementClasses;
  children?: Array<Component>;
}

// Example of a component function
function exampleSection(props: ExampleSectionProps) {
  return div({
    class: ["example", props.class],
    children: [...(props.children || [])],
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
    mapExample(),
    mouseFollowerExample(),
  ],
});

component.mount(document.getElementById("root")!);
