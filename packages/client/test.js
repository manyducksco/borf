import woof, { state, Service, Component, Styles } from "./dist/woof.js";

const app = woof({ hash: true });

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
});

/*===========================*\
||        Class Toggle       ||
\*===========================*/

class ToggleExample extends Component {
  active = state(false, {
    toggle: (current) => !current,
  });

  status = state.map(this.active, (current) => (current ? "ON" : "OFF"));

  init($) {
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
  count = state(0);

  init() {
    setInterval(() => {
      this.count(this.count() + 1);
    }, 1000);
  }

  reset() {
    this.count(0);
  }
}

app.service("counter", Counter);

/**
 * Component with controls and a mapped label based on the state inside the service.
 */
class CounterExample extends Component {
  init($) {
    const counter = this.app.services("counter");
    const label = state.map(counter.count, (n) => ` the number is: ${n}`);

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
  init($) {
    const counter = this.app.services("counter");

    return $("h1")($.text(counter.count));
  }
}

/*===========================*\
||   Conditional Rendering   ||
\*===========================*/

class ConditionalExample extends Component {
  show = state(false, {
    toggle: (current) => !current,
  });

  label = state.map(this.show, (on) => (on ? "Hide Text" : "Show Text"));

  init($) {
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
  init($) {
    const initialList = ["apple", "banana", "potato", "fried chicken"];
    const shoppingList = state(initialList, {
      append: (current, value) => [...current, value],
      reset: () => initialList,
    });

    const inputValue = state("");

    inputValue((value) => console.log(value));

    return $("div")(
      $("button")(
        {
          onclick: () => {
            const sorted = shoppingList()
              .map((x) => x)
              .sort();

            shoppingList(sorted);
          },
        },
        "Sort A to Z"
      ),
      $("button")(
        {
          onclick: () => {
            const sorted = shoppingList()
              .map((x) => x)
              .sort()
              .reverse();

            shoppingList(sorted);
          },
        },
        "Sort Z to A"
      ),

      $("div")(
        { style: { display: "flex", alignItems: "center" } },
        $("input")({
          type: "text",
          value: inputValue,
          oninput: (e) => {
            inputValue(e.target.value);
          },
        }),
        $("button")(
          {
            disabled: state.map(inputValue, (current) => current.trim() == ""),
            onclick: () => {
              shoppingList.append(inputValue());
              inputValue("");
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

      $.map(
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
  text = state("edit me");
  size = state(18);

  init($) {
    return $("div")(
      $("input")({
        value: this.text,
        oninput: (e) => {
          this.text(e.target.value);
        },
      }),
      $("input")({
        type: "number",
        value: this.size,
        oninput: (e) => {
          this.size(Number(e.target.value));
        },
      }),
      $("p")(
        {
          style: {
            fontSize: state.map(this.size, (s) => `${s}px`),
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
  init($) {
    this.request = this.http.get(
      "https://dog.ceo/api/breeds/image/random",
      async (ctx, next) => {
        await next();
        ctx.body = ctx.body.message;
      }
    );

    const label = state.map(this.request.isLoading, (yes) =>
      yes ? "NOW LOADING..." : "Loaded!"
    );

    return $("div")(
      $("img")({
        src: this.request.body,
        style: {
          height: "400px",
          border: "2px solid orange",
        },
      }),
      $("button")(
        {
          onclick: () => this.request.refresh(),
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
  position = state({ x: 0, y: 0 });

  init() {
    window.addEventListener("mousemove", (e) => {
      this.position({
        x: e.clientX,
        y: e.clientY,
      });
    });
  }
}

app.service("mouse", MouseInfo);

class MouseFollowerExample extends Component {
  init($) {
    const enabled = state(false, {
      toggle: (current) => !current,
    });
    const mouse = this.app.services("mouse");
    const transform = state.map(
      mouse.position,
      (m) => `translate(${m.x}px, ${m.y}px)`
    );

    const backgroundColor = state("#ff0088");
    const bestColor = "#ff0088";
    const notBestColor = state.map(
      backgroundColor,
      (hex) => hex.toLowerCase() !== bestColor
    );

    return $(ExampleSection)(
      $.if(
        enabled,
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
            backgroundColor(this.getRandomHex());
          },
          disabled: state.map(enabled, (x) => !x),
        },
        "Change Follower Color"
      ),

      $.if(
        notBestColor,
        $("button")(
          {
            onclick: () => backgroundColor(bestColor),
            disabled: state.map(enabled, (x) => !x),
          },
          "Reset To Best Color"
        )
      ),

      $("button")(
        {
          onclick: () => enabled.toggle(),
        },
        $.text(
          state.map(enabled, (x) =>
            x ? "Turn Off Follower" : "Turn On Follower"
          )
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
  init($) {
    return $("div")({ class: this.attributes.class }, ...this.children);
  }
}

/*===========================*\
||         Start App         ||
\*===========================*/

app.route("*", function ({ $, app }) {
  const mouse = app.services("mouse");

  // Display current mouse coordinates as tab title
  mouse.position((current) => {
    app.title = `x:${Math.round(current.x)} y:${Math.round(current.y)}`;
  });

  const example = $("div", { class: styles.example });

  return $("div")(
    { class: styles.demo },
    example($(ToggleExample)),
    example($(CounterExample), $(CounterViewLabel)),
    example($(ConditionalExample)),
    example($(MapExample)),
    example($(TwoWayBindExample)),
    example($(HTTPRequestExample)),
    example($(MouseFollowerExample))
  );
});

app.start("#app");
