import woof, { state, Service, Component } from "./dist/woof.js";

const app = woof({ hash: true });

class Counter extends Service {
  init() {
    this.count = state(5);
  }
}

class View extends Component {
  init($) {
    return $("div")("This is the view");
  }
}

app.service("counter", Counter);

app.route("*", function ({ $, app, http }) {
  app.title = "DOGGO";

  return $("div")(
    { class: "demo" },
    // $(ToggleExample),
    // $(CounterExample),
    classToggleExample($),
    counterExample($),
    conditionalExample($),
    twoWayBindExample($),
    httpRequestExample($, http)
    // mapExample($)
    // mouseFollowerExample($),
  );
});

app.start("#app");

/*===========================*\
||        Class Toggle       ||
\*===========================*/

function classToggleExample($) {
  const active = state(false, {
    toggle: (current) => !current,
  });
  const status = state.map(active, (current) => (current ? "ON" : "OFF"));

  setInterval(() => {
    active.toggle();
  }, 2000);

  return $("div")(
    {
      class: {
        example: true,
        active: active,
      },
    },
    $.text(status)
  );
}

/*===========================*\
||       Counter + Map       ||
\*===========================*/

function counterExample($) {
  const counter = state(0, {
    increment: (current) => current + 1,
    decrement: (current) => current - 1,
  });
  const label = state.map(counter, (n) => ` the number is: ${n}`);

  return $("div")(
    {
      class: ["example", "two"],
    },
    $("button")({ onclick: counter.increment }, "Increment"),
    $("button")({ onclick: counter.decrement }, "Decrement"),
    $.text(label)
  );
}

/*===========================*\
||      Two Way Binding      ||
\*===========================*/

function twoWayBindExample($) {
  const text = state("default");
  const size = state(18);

  return $("div")(
    {
      class: ["example", { three: true }],
    },
    $("input")({
      value: text,
      oninput: (e) => {
        text(e.target.value);
      },
    }),
    $("input")({
      type: "number",
      value: size,
      oninput: (e) => {
        size(Number(e.target.value));
      },
    }),
    $("p")(
      {
        style: {
          fontSize: state.map(size, (s) => `${s}px`),
        },
      },
      $.text(text, "Type Above")
    )
  );
}

/*===========================*\
||   Conditional Rendering   ||
\*===========================*/

function conditionalExample($) {
  const show = state(false, {
    toggle: (current) => !current,
  });
  const label = state.map(show, (on) => (on ? "Hide Text" : "Show Text"));

  return $("div")(
    {
      class: ["example", "four"],
    },
    $("button")(
      {
        onclick() {
          show.toggle();
        },
      },
      $.text(label)
    ),
    $.if(
      show,
      $("span")(
        {
          connected() {
            console.log("text was mounted");
          },
          disconnected() {
            console.log("text was unmounted");
          },
        },
        "Hello there!"
      )
    )
  );
}

/*===========================*\
||      Rendering Lists      ||
\*===========================*/

function mapExample($) {
  const shoppingList = state(["apple", "banana", "potato", "fried chicken"]);

  return $("div")(
    {
      class: ["example", "five"],
    },
    $(
      "button",
      {
        onClick() {
          const sorted = shoppingList()
            .map((x) => x)
            .sort();

          shoppingList(sorted);
        },
      },
      "Sort A to Z"
    ),
    $(
      "button",
      {
        onClick() {
          const sorted = shoppingList()
            .map((x) => x)
            .sort()
            .reverse();

          shoppingList(sorted);
        },
      },
      "Sort Z to A"
    ),
    $.map(
      shoppingList,
      (x) => x,
      (item) =>
        $("li")(
          {
            onClick() {
              alert(item);
            },
          },
          $.text(item)
        )
    )
  );
}

/*===========================*\
||       Mouse Follower      ||
\*===========================*/

// class MouseSource extends Source {
//   paused = false;

//   constructor() {
//     super({ x: 0, y: 0 });

//     window.addEventListener("mousemove", (e) => {
//       if (!this.paused) {
//         this.value = {
//           x: e.pageX,
//           y: e.pageY,
//         };
//         this.broadcast();
//       }
//     });
//   }
// }

// every X ms pass the function the old state and take its return value as the next state
// const num = new TickState(1, 300, (n) => n + 1);

// function getRandomHex() {
//   const hex = [
//     Math.random() * 256,
//     Math.random() * 256,
//     Math.random() * 256,
//   ]
//     .map(Math.floor)
//     .map((n) => n.toString(16))
//     .join("");

//   return "#" + hex;
// }

// function mouseFollowerExample() {
//   const enabled = new ToggleState(false);
//   const mouse = new MouseSource();
//   const backgroundColor = new State("#ff0088");
//   const transform = mouse.map((m) => `translate(${m.x}px, ${m.y}px)`);

//   const bestColor = "#ff0088";
//   const notBestColor = backgroundColor.map(
//     (hex) => hex.toLowerCase() !== bestColor
//   );

//   mouse.paused = !enabled.current;

//   // pause mouse listener when disabled
//   enabled.listen((value) => {
//     mouse.paused = !value;
//   });

//   return exampleSection({
//     class: ["mouse-follower"],
//     children: [
//       // TODO: Optimize - unsubscribe while component is not mounted
//       $.when(
//         enabled,
//         $("div", {
//           class: "follower",
//           style: {
//             transform,
//             backgroundColor,
//           },
//         })
//       ),

//       $("button", {
//         onClick: () => {
//           backgroundColor.set(getRandomHex());
//         },
//         children: [$.text("Change Follower Color")],
//         disabled: enabled.map((x) => !x),
//       }),
//       $.when(
//         notBestColor,
//         $("button", {
//           onClick: () => backgroundColor.set(bestColor),
//           disabled: enabled.map((x) => !x),
//           children: [$.text("Reset To Best Color")],
//         })
//       ),
//       $("button", {
//         onClick: () => enabled.toggle(),
//         children: [
//           $.text(
//             enabled.map((x) =>
//               x ? "Turn Off Follower" : "Turn On Follower"
//             )
//           ),
//         ],
//       }),
//     ],
//   });
// }

// Example of a component function
// function exampleSection(props) {
//   return $("div", {
//     class: ["example", props.class],
//     children: [...(props.children || [])],
//   });
// }

/*===========================*\
||        HTTP Request       ||
\*===========================*/

function httpRequestExample($, http) {
  const request = http.get(
    "https://dog.ceo/api/breeds/image/random",
    async (ctx, next) => {
      await next();
      console.log(ctx);
      ctx.body = ctx.body.message;
    }
  );
  const src = state.map(request.body, (body) => body);
  const label = state.map(request.isLoading, (yes) =>
    yes ? "NOW LOADING..." : "Loaded!"
  );

  setInterval(() => {
    request.refresh();
  }, 10000);

  src(console.log);

  return $("div")(
    {
      class: ["example", "http"],
    },
    $("img")({
      src,
      style: {
        height: "400px",
        border: "2px solid orange",
      },
    }),
    $.text(label)
  );
}
