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

Layout primitives.

```jsx
const Example = makeView({
  setup: (ctx, m) => {
    // Gap and padding are in units, which are defined at the top level of the app. 1 unit in this case could be something like 4px.
    return (
      <FlowRight gap={2} padding={4} scroll>
        {/* Children will flow from left to right with 8px between each item */}

        <FlowDown>{/* Children flow top to bottom */}</FlowDown>
      </FlowRight>
    );
  },
});
```
