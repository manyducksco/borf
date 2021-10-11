# Elements

Build a UI with DOM elements and reactive state.

## Special functions

- elements.when / elements.unless (conditional)
- elements.text (text node)
- elements.map (manage a 1-to-1 mapping of data to elements)

Children can be:

- a string
- an element
- an array of any of the above

elements.text can take a string or a subscription
elements.map can take an array or a subscription
elements.when/unless can take a static value or a subscription

NOTE: Warn when doing things that would cause accessibility problems like adding onClick to a div

```js
import { elements, State } from "*";

const { h1, form, div, label, input, ul, li } = elements;

const customButton = elements.create({
  extends: "button",
  class: ["custom-button"],
  onClick: () => {
    console.log("default");
  },
});

customButton({
  class: "some-other-class",
  class: ["one", "two"],
  class: {
    one: true,
    two: state.subscribe("isActive"),
  },
  class: ["one", {}],
  children: elements.text("HELLO"),
  onClick: () => {
    console.log("override");
  },
});

const styles = new Styles({
  container: {},
  content: {},
  contentList: {},
});

// compose two styles into one
// will be deep merged with overlapping props overwritten by later ones in argument order
const newStyles = Styles.merge(styles, otherStyles);

const modal = elements.modal({
  init(props) {
    // return elements to display
    // a separate modal instance is created each time the modal is shown
    // props object passed to show is forwarded to the init function
  },
});

modal.show(props);
modal.hide();

class Test extends Component {
  state = new State({
    count: 0,
  });

  numbers = this.state.map("count", (count) => {
    const arr = [];

    for (let i = 0; i < count; i++) {
      arr.push(i);
    }

    return arr;
  });

  init(props) {
    const { state, numbers } = this;

    // name subscriptions starting with $ as a convention
    const $title = state
      .map("count", (count) => `Clicked ${count} times`)
      .subscribe();

    const $hasManyClicks = state
      .map("count", (count) => count >= 10)
      .subscribe();

    return div({
      class: styles.container,
      children: [
        header({
          children: [
            h1({
              children: text($title),
            }),
            elements.when(
              $hasManyClicks,
              span({ children: "(that's a lot of clicks)" })
            ),
          ],
        }),
        div({
          class: styles.content,
          children: [
            button({
              onClick: () => {
                // increment using a set function
                // this function receives the current value and returns the new one
                state.set("count", (n) => n + 1);
              },
              children: "Click Me",
            }),
            ul({
              class: styles.contentList,
              children: elements.map(numbers.subscribe(), (num) =>
                li({ children: num })
              ),
            }),
          ],
        }),
      ],
    });
  }
}

interface ComponentProps {
  children: string | Component | Array<string | Component>,
  value: string | Subscription<string>,
  class: string | string[] | {
    [className: string]: boolean | Subscription<boolean>
  },

}

class Component<PropTypes extends ComponentProps> {
  props: PropTypes

  constructor(props: PropTypes) {
    this.props = props;
  }
}

class FormComponent extends Component {
  state = new State({
    firstName: "",
    lastName: ""
  })

  // called before component is added to the DOM
  // returns the component's structure in elements
  create() {
    return
  }

  // called after component is removed from the DOM
  destroy() {

  }
}

class WhenComponent extends Component {


  constructor() {

  }
}

interface BaseComponentProps {

}

class BaseComponent {
  constructor(tag: string, props: BaseComponentProps) {

  }
}

new BaseComponent("div", {
  onClick(e) {
    console.log(e.target);
  }
});

class DivComponent extends Component {
  create() {
    return document.createElement("div");
  }
}

class ToolbarComponent extends form {
  create() {
    return div({
      class: "toolbar",

    })
  }
}

() => {
  return div({
    children: [
      new FormComponent({
        onSubmit(e) {
          e.preventDefault();
          console.log(e.target);
        }
      })
    ]
  })
}

// <button class="custom-button some-other-class">HELLO</button>

// custom elements provide defaults
// classes are merged
// event handlers are overridden

function createForm() {
  const state = states.create({
    firstName: "",
    lastName: "",
    errors: [],
  });

  const fullName = state.map(
    ["firstName", "lastName"],
    (first, last) => `${first} ${last}`
  );

  return form({
    // always include '.name-form' but only include '.has-errors' if 'invalid' state is true
    class: [
      "name-form",
      {
        "has-errors": state
          .derive("errors", (errors) => errors.length > 0)
          .subscribe(),
      },
    ],

    onSubmit(e) {
      e.preventDefault();
      console.log(state.current);
    },

    style: {
      border: "1px solid orange",
      borderRadius: 8,
    },

    children: [
      h1({ children: [elements.text(fullName.subscribe())] }),
      div({
        class: "input-group",
        children: [
          label({ for: "first-name" }),
          input({
            type: "text",
            name: "first-name",
            value: state.bind("firstName"),
          }),
        ],
      }),

      ul({
        // 'elements.map' maintains a list that changes whenever the subscribed list gets a new value.
        children: elements.map(state.subscribe("errors"), err => err.message, (err) =>
          li({ class: ["list-item", "border"], children: err.message })
        ),
      }),
    ],
  });
}
```
