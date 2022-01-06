import { makeApp, makeState, makeService, makeComponent, Component, Styles } from "./dist/woof.js";

const app = makeApp({ hash: true });

// TODO: Plugins

// app.use((plugin) => {
//   // Plugins take the form of a function. This function gets a plugin object
//   // which is similar to an App, but only provides a handful of methods:
//   plugin.service("someName", class extends Service {});
//   plugin.route("*", class extends Component {});
//   plugin.setup((getService) => {}); // Plugin setups are all called at once and awaited with Promise.all before starting the app.
// });

const styles = new Styles({
  testing: {
    backgroundColor: "red",
  },
  example: {
    backgroundColor: "transparent",
    transition: "background-color 200ms",
    marginBottom: "1em",
    padding: "0.5em",
    border: "1px solid #ccc",
  },
  active: {
    backgroundColor: "#b6eeb6",
  },
  follower: {
    width: "32px",
    height: "32px",
    borderRadius: "50px",
    backgroundColor: "red",
    position: "fixed",
    top: "0",
    left: "0",
  },
  flexCenter: {
    display: "flex",
    alignItems: "center",
  },
});

/*===========================*\
||        Class Toggle       ||
\*===========================*/

class ToggleExample extends Component {
  $active = makeState(false);
  $status = this.$active.map((current) => (current ? "ON" : "OFF"));

  createElement($) {
    return $("div")(
      {
        class: {
          [styles.active]: this.$active, // class "active" is applied while this.$active is true
        },
        onclick: () => {
          this.$active.set((current) => !current);
        },
      },
      $.text(this.$status),
      "  (click to toggle)"
    );
  }
}

/*===========================*\
||    Counter with Service   ||
\*===========================*/

// class Counter extends Service {
//   $current = makeState(0);

//   _created() {
//     setInterval(() => {
//       this.$current.set((current) => current + 1);
//     }, 1000);
//   }

//   reset() {
//     this.$current.set(0);
//   }
// }

const CounterService = makeService((self) => {
  self.name = "CounterService"; // TODO: Default this to the name the service is registered under

  const $current = makeState(0);

  self.connected(() => {
    setInterval(() => {
      self.debug.log("tick", Date.now());
      $current.set((current) => current + 1);
    }, 1000);
  });

  return {
    $current,

    reset() {
      $current.set(0);
    },
  };
});

app.service("counter", CounterService);

/**
 * Component with controls and a mapped label based on the state inside the service.
 */
const CounterExample = makeComponent(($, self) => {
  const counter = self.getService("counter");
  const label = counter.$current.map((n) => ` the number is: ${n}`);

  return $("div")($("button")({ onclick: () => counter.reset() }, "Reset"), $.text(label));
});

/**
 * Second component with a view only. Displays the same information from the same service.
 */
// class CounterViewLabel extends Component {
//   createElement($) {
//     const counter = this.service("counter");

//     return $("h1")($.text(counter.$current));
//   }
// }

const CounterViewLabel = makeComponent(($, self) => {
  const { $current } = self.getService("counter");

  return $("h1")($.text($current));
});

/*===========================*\
||   Conditional Rendering   ||
\*===========================*/

class ConditionalExample extends Component {
  $show = makeState(false);
  $label = this.$show.map((on) => (on ? "Hide Text" : "Show Text"));

  createElement($) {
    return $("div")(
      $("button")(
        {
          onclick: () => {
            this.$show.set((current) => !current);
          },
        },
        $.text(this.$label)
      ),
      $.if(
        this.$show,
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
}

/*===========================*\
||      Rendering Lists      ||
\*===========================*/

class MapExample extends Component {
  createElement($) {
    const initialList = ["apple", "banana", "potato", "fried chicken"];

    const $shoppingList = makeState(initialList);
    const $inputValue = makeState("");

    return $("div")(
      $("button")(
        {
          onclick: () => {
            const sorted = $shoppingList
              .get()
              .map((x) => x)
              .sort();

            $shoppingList.set(sorted);
          },
        },
        "Sort A to Z"
      ),
      $("button")(
        {
          onclick: () => {
            const sorted = $shoppingList
              .get()
              .map((x) => x)
              .sort()
              .reverse();

            $shoppingList.set(sorted);
          },
        },
        "Sort Z to A"
      ),

      $("div")(
        { class: styles.flexCenter },
        $("input")({
          type: "text",
          value: $inputValue,
          oninput: (e) => {
            $inputValue.set(e.target.value);
          },
        }),
        $("button")(
          {
            disabled: $inputValue.map((current) => current.trim() == ""),
            onclick: () => {
              $shoppingList.set((current) => {
                current.push($inputValue.get());
              });
              $inputValue.set("");
            },
          },
          "Add Item"
        ),
        $("button")(
          {
            onclick: () => {
              $shoppingList.set(initialList);
            },
          },
          "Reset List"
        )
      ),

      $.each(
        $shoppingList,
        (item) => item, // use items as keys as they are already unique strings
        (item) =>
          $("li")(
            {
              onclick() {
                alert(item);
              },
            },
            $.text(item)
          )
      )
    );
  }
}

/*===========================*\
||      Two Way Binding      ||
\*===========================*/

class TwoWayBindExample extends Component {
  $text = makeState("edit me");
  $size = makeState(18);

  createElement($) {
    return $("div")(
      $("input")({
        value: $.bind(this.$text),
      }),
      $("input")({
        type: "number",
        value: $.bind(this.$size), // number value gets converted back to number
      }),
      $("p")(
        {
          style: {
            fontSize: this.$size.map((s) => `${s}px`),
          },
        },
        $.text(this.$text)
      )
    );
  }
}

/*===========================*\
||        HTTP Request       ||
\*===========================*/

// class HTTPRequestExample extends Component {
//   $loading = makeState(false);
//   $image = makeState(null);

//   _connected() {
//     this.refresh();
//   }

//   refresh() {
//     this.$loading.set(true);
//     this.service("@http")
//       .get("https://dog.ceo/api/breeds/image/random")
//       .then((res) => {
//         this.$image.set(res.body.message);
//       })
//       .finally(() => {
//         this.$loading.set(false);
//       });
//   }

//   createElement($) {
//     const label = this.$loading.map((yes) => (yes ? "NOW LOADING..." : "Loaded!"));

//     return $("div")(
//       $("img")({
//         src: this.$image,
//         style: {
//           height: "400px",
//           border: "2px solid orange",
//         },
//       }),
//       $("button")(
//         {
//           onclick: () => this.refresh(),
//         },
//         "Next Doggo"
//       ),
//       $.text(label)
//     );
//   }
// }

/**
 * Woof function components. How does this work?
 *
 * The main function body is the createElement function.
 * But it has to run to get the lifecycle methods.
 * Is that a problem?
 *
 * Function is called once just before mounting
 * gets lifecycle hooks registered, calls them
 * mounts the element returned from the function
 *
 * This approach lets us add methods on the component itself
 * that make it easy to connect
 */
const HTTPRequestExample = makeComponent(($, self) => {
  const $loading = makeState(false);
  const $image = makeState();

  const $label = $loading.map((yes) => (yes ? "NOW LOADING..." : "Loaded!"));

  // self object has:
  // getService
  // beforeConnect, connected
  // beforeDisconnect, disconnected
  // watchState
  // $route, $attrs

  const refresh = () => {
    $loading.set(true);

    return self
      .getService("@http")
      .get("https://dog.ceo/api/breeds/image/random")
      .then((res) => {
        $image.set(res.body.message);
      })
      .finally(() => {
        $loading.set(false);
      });
  };

  self.connected(() => {
    refresh();
  });

  const { $title } = self.getService("@page");

  self.watchState($title, (title) => {
    console.log("Page title: " + title);
  });

  return $("div")(
    $("img")({
      src: $image,
      style: {
        height: "400px",
        border: "2px solid orange",
      },
    }),
    $("button")({ onclick: refresh }, "Next Doggo"),
    $.text($label)
  );
});

// const component = FunctionExample.create(getService, $route, attrs, ...children);

// // This needs to work with multiple renderers (string, DOM, etc.)

// component.connect(domNode);
// component.disconnect();

/*===========================*\
||       Mouse Follower      ||
\*===========================*/

// self object has:
// getService
// connected
// watchState

const MouseInfoService = makeService((self) => {
  self.name = "MouseInfoService";

  const $position = makeState({ x: 0, y: 0 });

  window.addEventListener("mousemove", (e) => {
    $position.set({
      x: e.clientX,
      y: e.clientY,
    });
  });

  return {
    $position,
  };
});

app.service("mouse", MouseInfoService);

const MouseFollowerExample = makeComponent(($, self) => {
  const mouse = self.getService("mouse");
  const bestColor = "#ff0088";

  const $isEnabled = makeState(false);
  const $backgroundColor = makeState(bestColor);
  const $transform = mouse.$position.map((m) => `translate(${m.x}px, ${m.y}px)`);
  const $isNotBestColor = $backgroundColor.map((hex) => hex.toLowerCase() !== bestColor);

  const getRandomHex = () => {
    const hex = [Math.random() * 256, Math.random() * 256, Math.random() * 256]
      .map(Math.floor)
      .map((n) => n.toString(16))
      .join("");

    return "#" + hex;
  };

  return $(ExampleSection)(
    $.if(
      $isEnabled,
      $("div")({
        class: styles.follower,
        style: {
          transform: $transform,
          backgroundColor: $backgroundColor,
        },
      })
    ),

    $("button")(
      {
        onclick: () => {
          $backgroundColor.set(getRandomHex());
        },
        disabled: $isEnabled.map((x) => !x),
      },
      "Change Follower Color"
    ),

    $.if(
      $isNotBestColor,
      $("button")(
        {
          onclick: () => $backgroundColor.set(bestColor),
          disabled: $isEnabled.map((x) => !x),
        },
        "Reset To Best Color"
      )
    ),

    $("button")(
      { onclick: () => $isEnabled.set((current) => !current) },
      $.text($isEnabled.map((x) => (x ? "Turn Off Follower" : "Turn On Follower")))
    )
  );
});

const ExampleSection = makeComponent(($, self) => {
  console.log(self.$attrs.get());

  return $("div")({ class: self.$attrs.map("class") }, ...self.children);
});

/*===========================*\
||         Start App         ||
\*===========================*/

// TODO: Routes should need to end with wildcard to contain subroutes.
//       This way we can use wildcard matches to signal a check for subroutes.
//       $.route() throws helpful error when called on a non-wildcard route.

// NOTE: Passing just a function will create a new component with that function
app.route("*", ($, self) => {
  self.preload((done) => {
    console.log("TESTING PRELOAD");

    setTimeout(() => {
      done();
      console.log("DONE");
    }, 500);

    return $("h1")("Yo preloading...");
  });

  self.connected(() => {
    const page = self.getService("@page");
    const mouse = self.getService("mouse");

    // Display current mouse coordinates as tab title
    self.watchState(mouse.$position, (current) => {
      page.$title.set(`x:${Math.round(current.x)} y:${Math.round(current.y)}`);
    });
  });

  const example = $("div", { class: styles.example });

  return $("div", { class: styles.demo })(
    $("div", { class: "nav" })(
      $("ul")(
        $("li")($("a", { href: "/examples" })("Examples")),
        $("li")($("a", { href: "/test2" })("Test Two")),
        $("li")($("a", { href: "/test2/chunk1" })("Test Two - Chunk One")),
        $("li")($("a", { href: "/test2/chunk2" })("Test Two - Chunk Two"))
      )
    ),
    // Nested routes are relative to the current route.
    $.outlet()
      .route("examples", ($) =>
        $("div")(
          example($(ToggleExample)),
          example($(CounterExample), $(CounterViewLabel)),
          example($(ConditionalExample)),
          example($(MapExample)),
          example($(TwoWayBindExample)),
          example($(HTTPRequestExample)),
          example($(MouseFollowerExample))
        )
      )
      // Routes can be nested further with wildcards.
      // This $ function will be pre-loaded with the fragments after 'test2' to match against with $.route().
      // $.route() acts like a switch statement. When it is connected, it picks the best route and renders it.
      .route("test2/*", ($) =>
        $("div")(
          $("h1")("ROUTER"),
          $.outlet()
            .route("/", ($) => $("div")("default"))
            .route("chunk1", ($) => $("h1")("This is the chunk1 page"))
            .route("chunk2", ($) => $.text("HELLO CHUNK2"))
        )
      )
  );
});

// class extends Component {
//   preload($, done) {
//     console.log("TESTING PRELOAD");

//     setTimeout(() => {
//       done();
//       console.log("DONE");
//     }, 500);

//     return $("h1")("Yo preloading...");
//   }

//   _connected() {
//     const page = this.service("@page");
//     const mouse = this.service("mouse");

//     // Display current mouse coordinates as tab title
//     this.watchState(mouse.$position, (current) => {
//       page.$title.set(`x:${Math.round(current.x)} y:${Math.round(current.y)}`);
//     });
//   }

//   createElement($) {
//     const example = $("div", { class: styles.example });

//     return $("div", { class: styles.demo })(
//       $("div", { class: "nav" })(
//         $("ul")(
//           $("li")($("a", { href: "/examples" })("Examples")),
//           $("li")($("a", { href: "/test2" })("Test Two")),
//           $("li")($("a", { href: "/test2/chunk1" })("Test Two - Chunk One")),
//           $("li")($("a", { href: "/test2/chunk2" })("Test Two - Chunk Two"))
//         )
//       ),
//       // Nested routes are relative to the current route.
//       $.outlet()
//         .route("examples", ($) =>
//           $("div")(
//             example($(ToggleExample)),
//             example($(CounterExample), $(CounterViewLabel)),
//             example($(ConditionalExample)),
//             example($(MapExample)),
//             example($(TwoWayBindExample)),
//             example($(HTTPRequestExample)),
//             example($(MouseFollowerExample))
//           )
//         )
//         // Routes can be nested further with wildcards.
//         // This $ function will be pre-loaded with the fragments after 'test2' to match against with $.route().
//         // $.route() acts like a switch statement. When it is connected, it picks the best route and renders it.
//         .route("test2/*", ($) =>
//           $("div")(
//             $("h1")("ROUTER"),
//             $.outlet()
//               .route("/", ($) => $("div")("default"))
//               .route("chunk1", ($) => $("h1")("This is the chunk1 page"))
//               .route("chunk2", ($) => $.text("HELLO CHUNK2"))
//           )
//         )
//     );
//   }
// }

app.setup((getService) => {
  getService("@debug").$filter.set("*");
});

app.connect("#app");
