import { makeApp, makeState, makeService, makeComponent, Styles } from "./dist/woof.js";

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

// const makeClass = () => {};

// const button = makeClass({

// });

// // Pseudo selectors are methods on the class object
// button.active({
//   /* styles */
// });
// button.not(active.lastChild, {
//   /* styles */
// });

// const active = makeClass({

// });

// button.active(active);

// button.

/*===========================*\
||        Class Toggle       ||
\*===========================*/

const ToggleExample = makeComponent(($, self) => {
  const $active = makeState(false);
  const $status = $active.map((current) => (current ? "ON" : "OFF"));

  return $("div")(
    {
      class: {
        [styles.active]: $active, // class "active" is applied while $active is true
      },
      onclick: () => {
        $active.set((current) => !current);
      },
    },
    $.text($status),
    "  (click to toggle)"
  );
});

/*===========================*\
||    Counter with Service   ||
\*===========================*/

const CounterService = makeService((self) => {
  self.debug.name = "CounterService"; // TODO: Default this to the name the service is registered under

  const $current = makeState(0);

  self.connected(() => {
    setInterval(() => {
      // self.debug.log("tick", Date.now());
      $current.set((current) => current + 1);
    }, 1000);
  });

  self.watchState(
    $current,
    (current) => {
      // Make debug not a service. It should be accessible before the first service loads.
      // const channel = debug.makeChannel(); // channel is created and passed down to every component and service like this
      // // fields on channel object which feed messages and metadata up to the app, where it can handle those feeds and store them for dev tools
      // // references settings from top level
      // channel.name = "ComponentName";
      // channel.label = "custom:test";
      // channel.log();
      // channel.warn();
      // channel.error();
      // self.debug.log(current);
    }
    // { immediate: true }
  );

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
  self.debug.label = "component:counterexample";

  const counter = self.getService("counter");
  const $label = counter.$current.map((n) => ` the number is: ${n}`);

  return $("div")(
    $("button")(
      {
        onclick: counter.reset,
      },
      "Reset"
    ),
    $.text($label)
  );
});

// const CounterService = makeService((self) => {
//   const $count = makeState(0);

//   return {
//     $count,
//   };
// });

// const Counter = makeComponent(($, self) => {
//   const { $count } = self.getService("counter");

//   return $("div")(
//     $("p")($.text($count)),
//     $("div")(
//       $(CounterButton)({
//         onclick: () => $count.set((current) => current + 1),
//         label: "+1",
//       }),
//       $(CounterButton)({
//         onclick: () => $count.set((current) => current + 1),
//         label: "-1",
//       })
//     )
//   );
// });

// const CounterButton = makeComponent(($, self) => {
//   return $("button")(
//     {
//       onclick: self.$attrs.get("onclick"),
//     },
//     $.text(self.$attrs.map("label"))
//   );
// });

/**
 * Second component with a view only. Displays the same information from the same service.
 */
const CounterViewLabel = makeComponent(($, self) => {
  const { $current } = self.getService("counter");

  return $("h1")($.text($current));
});

/*===========================*\
||   Conditional Rendering   ||
\*===========================*/

const ConditionalExample = makeComponent(($, self) => {
  const $show = makeState(false);
  const $label = $show.map((on) => (on ? "Hide Text" : "Show Text"));

  return $("div")(
    $("button")(
      {
        onclick: () => {
          $show.set((current) => !current);
        },
      },
      $.text($label)
    ),
    $.if($show, $("span")("Hello there!"))
  );
});

/*===========================*\
||      Rendering Lists      ||
\*===========================*/

const MapExample = makeComponent(($, self) => {
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
});

/*===========================*\
||      Two Way Binding      ||
\*===========================*/

const TwoWayBindExample = makeComponent(($, self) => {
  const $text = makeState("edit me");
  const $size = makeState(18);

  return $("div")(
    $("input")({
      value: $.bind($text),
    }),
    $("input")({
      type: "number",
      value: $.bind($size), // number value gets converted back to number
    }),
    $("p")(
      {
        style: {
          fontSize: $size.map((s) => `${s}px`),
        },
      },
      $.text($text)
    )
  );
});

/*===========================*\
||        HTTP Request       ||
\*===========================*/

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

/*===========================*\
||       Mouse Follower      ||
\*===========================*/

const MouseInfoService = makeService((self) => {
  self.debug.name = "MouseInfoService";

  const $position = makeState({ x: 0, y: 0 });

  self.connected(() => {
    window.addEventListener("mousemove", (e) => {
      $position.set({
        x: e.clientX,
        y: e.clientY,
      });
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

  // Children can be one of:
  // - Dolla template
  // - Dolla node
  // - string (displayed as text node)
  // - null, undefined, false (ignored)
  // $("div")($(OtherComponent), $(OtherComponent)(), "string", null, undefined, false);

  // All children are converted to nodes

  // $.text(), $.outlet(), $.map(), $.if(), $.watch() return nodes

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
  self.debug.label = "routes:root";

  self.preload((done) => {
    self.debug.log("TESTING PRELOAD");

    setTimeout(() => {
      done();
      self.debug.log("DONE");
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
        // TODO: Throw error if the wrong dolla is used in a route.
        // New dollas are established for each outlet, so using the component-level one may cause route matching problems
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
            .route("*", ($, self) => {
              self.debug.log(self.$route.get());
            })
        )
      )
      .route("*", makeRedirect("/examples"))
  );
});

const makeRedirect = (path) => {
  return makeComponent(($, self) => {
    self.getService("@page").go(path);

    return $("span")();
  });
};

app.setup((getService) => {
  getService("@debug").$filter.set("*");
});

app.connect("#app");
