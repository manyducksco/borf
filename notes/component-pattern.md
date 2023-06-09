# Component Pattern

Trying to come up with an abstract pattern for object-oriented "UI components" that can be implemented in multiple languages.

This would be one pattern that solves the common needs of UI elements that I have encountered in my work.

These problems are (in the order they come to mind):

- component state and updating according to changes
- base building block components (with mappings to various backends; HTML, native libraries with Node or other runtime?, ???)
- styling individual components
- callbacks for lifecycle events
- async callbacks for transitions? (this is a major part of most apps these days)
-

## Next

After this, I want to try coming up with a pattern for UI in a pure functional style.

```js
import {} from "components";

class Component {}

class TextInput extends Component {
  // Defines initial state for the component.
  static getInitialState() {
    return {};
  }

  static getProperties() {
    return {
      value: String,
    };
  }

  value = "";

  constructor(inputs, children) {
    super(inputs, children);
  }

  // Creates the initial component structure.
  create() {}

  // Called once the component
  destroy() {}

  render() {
    return [
      new VBox(
        {
          gap: 2 /* layout units (some amount of pixels, configured globally) */,
          styles: [new Style({ padding: 2 })],
        },
        [
          new Label({
            text: this.state.live(
              (s) => `Clicked ${s.count} time${s.count === 1 ? "" : "s"}`
            ),
          }),
          new Button({
            text: "Click Me",
            action: () => {
              this.state.update((s) => ({ count: s.count + 1 }));
            },
            styles: [
              new Style({
                // Static methods for common colors
                background: Color.gray(),
                text: Color.white(),
                padding: 1,
              }),

              // Overrides when a mouse is hovering
              Style.hover(
                new Style({
                  background: new Color("#ff0088"), // one color instance can be shared across many components. If that color instance changes, all users change color.
                  text: new Color("#fff"),
                })
              ),

              // Overrides when active (in the case of a button, that's when it's pressed)
              Style.active(
                new Style({
                  background: new Color("#ff0088"),
                  text: new Color("#fff"),
                })
              ),
            ],
          }),
        ]
      ),
    ];
  }

  // Called when props change. Updates elements.
  onInputsChanged(newInputs, oldInputs) {
    // Just... store the inputs in state for some reason?
    this.setState({
      ...newInputs,
    });
  }

  onInputChanged(name, newValue, oldValue) {
    // Alternative: Fire for each one? This could be less efficient.
  }

  onConnected() {
    // Called once a parent component connects this one as a child.
  }

  onDisconnected() {
    // Called once a parent component disconnects this one as a child.
  }
}
```

```rb
class TextInput < Component
  def create

  end

  def destroy

  end

  def render
    [
      Container.new({}, [

      ])
    ]
  end
end
```
