# @woofjs/ui

Create a UI library built on woof. Standard input elements that are fully stylable and take advantage of states wherever possible.

## Components

- TextInput
- TextArea (auto-resize with # of lines option)
- DateTimeInput
- Checkbox
- RadioButton
- Modal

- SafeArea (container for content that uses safe-area-inset-\* variables)
- HistoryStack (like iOS navigation stack where you can animate nav transitions forward and back)

Layout primitives (Flow components):

```jsx
class Example extends View {
  setup(ctx, m) {
    // Gap and padding are in units, which are defined on a FlowLayoutStore. Here 1 unit is 4px.
    return (
      <FlowLayoutStore unit="4px">
        <FlowRight
          breakpoints={{ "800": { gap: 3, fill: 0.5 } }}
          gap={2}
          padding={4}
          align="center"
          justify="center"
          fill={1}
          scroll
        >
          {/* Children will flow from left to right with 8px gap between each item and 16px padding around */}
          {/* Content scrolls horizontally */}

          <FlowDown>{/* Children flow top to bottom */}</FlowDown>
        </FlowRight>
      </FlowLayoutStore>
    );
  },
}

// Can also be configured globally on the app.
stores = [
  { store: FlowLayoutStore, attrs: { unit: "4px", defaults: { gap: 2, padding: 4 } } }
]
```

## Gesture Recognizers

Utils to recognize and respond to common touch gestures like panning and pinching. These are relatively hard to get right.

How do we define a pan or pinch?

- Pan: user puts their finger down at one spot, moves their finger to another spot and picks their finger up.
- Pinch:

```jsx
import { View } from "woofe";
import { DragZone } from "woofe/ui";
import { omit } from "woofe/tools";

interface DragState {}

class Example extends View {
  setup(ctx, m) {
    const [ref, $state] = makeDraggable({});

    const filtered = ctx.attrs.as(omit(["ignoreMe", "onClick"]));

    return (
      <DragZone>
        <div ref={ref} etc={{ class: "more stuff" }}>
          Drag Me
        </div>
      </DragZone>
    );
  }
}
```
