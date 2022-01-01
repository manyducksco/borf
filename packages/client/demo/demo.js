import { App, Service, Component, Styles, makeState } from "./dist/woof.js";

const app = new App({ hash: true });

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
  active = makeState(false, {
    methods: {
      toggle: (current) => !current,
    },
  });

  status = this.active.map((current) => (current ? "ON" : "OFF"));

  createElement($) {
    return $("div")(
      {
        class: {
          [styles.active]: this.active, // class "active" is applied while this.active is true
        },
        onclick: () => {
          this.active.toggle();
        },
      },
      $.text(this.status),
      "  (click to toggle)"
    );
  }
}

/*===========================*\
||    Counter with Service   ||
\*===========================*/

class Counter extends Service {
  current = makeState(0);

  _created() {
    setInterval(() => {
      this.current.set((current) => current + 1);
    }, 1000);
  }

  reset() {
    this.current.set(0);
  }
}

app.service("counter", Counter);

/**
 * Component with controls and a mapped label based on the state inside the service.
 */
class CounterExample extends Component {
  createElement($) {
    const counter = this.service("counter");
    const label = counter.current.map((n) => ` the number is: ${n}`);

    return $("div")(
      $("button")(
        {
          onclick: () => counter.reset(),
        },
        "Reset"
      ),
      $.text(label)
    );
  }
}

/**
 * Second component with a view only. Displays the same information from the same service.
 */
class CounterViewLabel extends Component {
  createElement($) {
    const counter = this.service("counter");

    return $("h1")($.text(counter.current));
  }
}

/*===========================*\
||   Conditional Rendering   ||
\*===========================*/

class ConditionalExample extends Component {
  show = makeState(false, {
    methods: {
      toggle: (current) => !current,
    },
  });

  label = this.show.map((on) => (on ? "Hide Text" : "Show Text"));

  createElement($) {
    return $("div")(
      $("button")(
        {
          onclick: () => {
            this.show.toggle();
          },
        },
        $.text(this.label)
      ),
      $.if(
        this.show,
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
    const shoppingList = makeState(initialList, {
      methods: {
        append: (current, value) => [...current, value],
        reset: () => initialList,
      },
    });

    const inputValue = makeState("");

    return $("div")(
      $("button")(
        {
          onclick: () => {
            const sorted = shoppingList
              .get()
              .map((x) => x)
              .sort();

            shoppingList.set(sorted);
          },
        },
        "Sort A to Z"
      ),
      $("button")(
        {
          onclick: () => {
            const sorted = shoppingList
              .get()
              .map((x) => x)
              .sort()
              .reverse();

            shoppingList.set(sorted);
          },
        },
        "Sort Z to A"
      ),

      $("div")(
        { class: styles.flexCenter },
        $("input")({
          type: "text",
          value: inputValue,
          oninput: (e) => {
            inputValue.set(e.target.value);
          },
        }),
        $("button")(
          {
            disabled: inputValue.map((current) => current.trim() == ""),
            onclick: () => {
              shoppingList.append(inputValue.get());
              inputValue.set("");
            },
          },
          "Add Item"
        ),
        $("button")(
          {
            onclick: () => {
              shoppingList.reset();
            },
          },
          "Reset List"
        )
      ),

      $.each(
        shoppingList,
        (x) => x, // use items as keys as they are already unique strings
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
  text = makeState("edit me");
  size = makeState(18);

  createElement($) {
    return $("div")(
      $("input")({
        value: $.bind(this.text),
      }),
      $("input")({
        type: "number",
        value: $.bind(this.size), // number value gets converted back to number
      }),
      $("p")(
        {
          style: {
            fontSize: this.size.map((s) => `${s}px`),
          },
        },
        $.text(this.text)
      )
    );
  }
}

/*===========================*\
||        HTTP Request       ||
\*===========================*/

class HTTPRequestExample extends Component {
  loading = makeState(false);
  image = makeState(null);

  _connected() {
    this.refresh();
  }

  refresh() {
    this.loading.set(true);
    this.service("@http")
      .get("https://dog.ceo/api/breeds/image/random")
      .then((res) => {
        console.log(res);
      })
      .finally(() => {
        this.loading.set(false);
      });
  }

  createElement($) {
    const label = this.loading.map((yes) =>
      yes ? "NOW LOADING..." : "Loaded!"
    );

    return $("div")(
      $("img")({
        src: this.image,
        style: {
          height: "400px",
          border: "2px solid orange",
        },
      }),
      $("button")(
        {
          onclick: () => this.refresh(),
        },
        "Next Doggo"
      ),
      $.text(label)
    );
  }
}

/*===========================*\
||       Mouse Follower      ||
\*===========================*/

class MouseInfo extends Service {
  position = makeState({ x: 0, y: 0 });

  _created() {
    window.addEventListener("mousemove", (e) => {
      this.position.set({
        x: e.clientX,
        y: e.clientY,
      });
    });
  }
}

app.service("mouse", MouseInfo);

class MouseFollowerExample extends Component {
  createElement($) {
    const isEnabled = makeState(false, {
      methods: {
        toggle: (current) => !current,
      },
    });
    const mouse = this.service("mouse");
    const transform = mouse.position.map(
      (m) => `translate(${m.x}px, ${m.y}px)`
    );

    const bestColor = "#ff0088";
    const backgroundColor = makeState(bestColor);
    const isNotBestColor = backgroundColor.map(
      (hex) => hex.toLowerCase() !== bestColor
    );

    return $(ExampleSection)(
      $.if(
        isEnabled,
        $("div")({
          class: styles.follower,
          style: {
            transform,
            backgroundColor,
          },
        })
      ),

      $("button")(
        {
          onclick: () => {
            backgroundColor.set(this.getRandomHex());
          },
          disabled: isEnabled.map((x) => !x),
        },
        "Change Follower Color"
      ),

      $.if(
        isNotBestColor,
        $("button")(
          {
            onclick: () => backgroundColor.set(bestColor),
            disabled: isEnabled.map((x) => !x),
          },
          "Reset To Best Color"
        )
      ),

      $("button")(
        {
          onclick: () => isEnabled.toggle(),
        },
        $.text(
          isEnabled.map((x) => (x ? "Turn Off Follower" : "Turn On Follower"))
        )
      )
    );
  }

  getRandomHex() {
    const hex = [Math.random() * 256, Math.random() * 256, Math.random() * 256]
      .map(Math.floor)
      .map((n) => n.toString(16))
      .join("");

    return "#" + hex;
  }
}

class ExampleSection extends Component {
  createElement($) {
    return $("div")({ class: this.attributes.class }, ...this.children);
  }
}

/*===========================*\
||         Start App         ||
\*===========================*/

// TODO: Routes should need to end with wildcard to contain subroutes.
//       This way we can use wildcard matches to signal a check for subroutes.
//       $.route() throws helpful error when called on a non-wildcard route.

app.route(
  "*",
  class extends Component {
    preload($, done) {
      console.log("TESTING PRELOAD");

      setTimeout(() => {
        done();
        console.log("DONE");
      }, 500);

      return $("h1")("Yo preloading...");
    }

    _connected() {
      const page = this.service("@page");
      const mouse = this.service("mouse");

      // Display current mouse coordinates as tab title
      this.watchState(mouse.position, (current) => {
        page.title.set(`x:${Math.round(current.x)} y:${Math.round(current.y)}`);
      });
    }

    createElement($) {
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
          .route(
            "examples",
            class extends Component {
              createElement($) {
                return $("div")(
                  example($(ToggleExample)),
                  example($(CounterExample), $(CounterViewLabel)),
                  example($(ConditionalExample)),
                  example($(MapExample)),
                  example($(TwoWayBindExample)),
                  example($(HTTPRequestExample)),
                  example($(MouseFollowerExample))
                );
              }
            }
          )
          // Routes can be nested further with wildcards.
          // This $ function will be pre-loaded with the fragments after 'test2' to match against with $.route().
          // $.route() acts like a switch statement. When it is connected, it picks the best route and renders it.
          .route(
            "test2/*",
            class extends Component {
              // TODO: Rename createElement to view
              createElement($) {
                return $("div")(
                  $("h1")("ROUTER"),
                  $.outlet()
                    .route(
                      "/",
                      class extends Component {
                        createElement($) {
                          return $("div")("default");
                        }
                      }
                    )
                    .route(
                      "chunk1",
                      class extends Component {
                        createElement($) {
                          return $("h1")("This is the chunk1 page");
                        }
                      }
                    )
                    .route(
                      "chunk2",
                      class extends Component {
                        createElement($) {
                          return $.text("HELLO CHUNK2");
                        }
                      }
                    )
                );
              }
            }
          )
      );
    }
  }
);

app.setup((service) => {
  service("@debug").filter.set("*");
});

app.connect("#app");
