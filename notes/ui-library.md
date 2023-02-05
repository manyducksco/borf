# @woofjs/ui

Create a UI library built on woofe. Standard input elements that are fully stylable and take advantage of states wherever possible. I want to take a lower level building block approach. These are generic inputs mostly useful for their logic that you probably want to style yourself. I'm not interested in enforcing a house style or having opinionated views like profile images, badges, etc.

## Components

- TextInput
- TextArea (auto-resize with # of lines option)
- TimeInput (supports date-only, time-only or full datetime with time zone depending on inputs)
- Checkbox
- RadioButton
- Modal
- EmailInput
- PhoneInput
- ColorInput
- DrawInput (A basic drawing input that generates an image, like a signature)
- SuggestionInput (Suggests from a finite list of results as you start to type)

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
  { store: FlowLayoutStore, inputs: { unit: "4px", defaults: { gap: 2, padding: 4 } } }
]
```

## Gesture Recognizers

Utils to recognize and respond to common touch gestures like panning and pinching. These are very hard to get right with native drag and drop APIs in my experience.

How do we define various gestures?

- Tap: user puts their finger down at one spot and quickly removes it.
- Drag: user puts their finger down at one spot, moves their finger to another spot and picks their finger up.
- Pinch: user puts 2+ fingers down and moves them closer together or further apart relative to a center point.

What about accelerometer stuff like shaking the device, rotating in different directions, etc? Are these important enough to include in the gesture suite?

```jsx
import { View } from "woofe";
import { DragZone, Draggable } from "woofe/ui";

class Example extends View {
  setup(ctx, m) {
    return (
      <DragZone>
        <DropZone
          onDrop={(data) => {
            ctx.log(`Dropped draggable with value ${data.value}`);
          }}
          onEnter={(data) => {
            // Draggable has entered but not been dropped yet.
          }}
          onExit={(data) => {
            // Draggable has exited the drop zone.
          }}
          onMove={(data) => {
            // Draggable has moved over the drop zone.
          }}
        >
          Draggables can be dropped into a DropZone?
        </DropZone>

        <Draggable data={{ value: 1 }}>Drag Me</Draggable>
        <Draggable data={{ value: 2 }}>Drag Me Too</Draggable>
      </DragZone>
    );
  }
}
```
