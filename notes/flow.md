# Flow

Flow is a flexible layout system for quickly creating app-like layouts

Layout primitives (Flow components):

```jsx
class Example extends View {
  setup(ctx, m) {
    // Gap and padding are in units, which are defined on a FlowStore. Here 1 unit is 4px.

    return (
      // FlowStore takes default config options and some options of its own (like unit).
      <FlowStore unit="4px" gap={2} padding={2}>
        {/* Individual flows adopt the defaults from the nearest store, overriding what they need to */}
        <Flow
          right
          scroll
          breakpoints={{ 800: { gap: 3, fill: 0.5 } }}
          gap={2}
          inset={4}
          align="center"
          justify="center"
          fill={1} // Fill is the percentage of the parent container this container should take up (from 0 to 1)
        >
          {/* Children will flow from left to right with 8px gap between each item and 16px padding around */}
          {/* Content scrolls horizontally */}

          <Flow down>{/* Children flow top to bottom */}</Flow>
        </Flow>
      </FlowStore>
    );
  },
}
```
