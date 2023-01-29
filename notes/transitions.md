# Transitions

Transitions can be a lot better than they are in their current form. There are two pieces; spring animations and a reworked transition API.

## Spring Animations

Transition animations should be easy. Spring animations are pretty intuitive once you see them in action. Using springs means you can think only about what value you need to animate to and the spring handles the rest.

```jsx
const spring = makeSpring(0, {
  stiffness: 100,
  damping: 300,
});

// Set value to -100 without animating. Resets inertia.
await spring.snapTo(-100);

// Animate value to 100. Promise resolves when the animation reaches its end.
await spring.to(100);

// Alternate 'from, to' syntax to snap to first value and animate to second.
// Mirrors the tween API, but with spring attributes.
await spring.animate(-100, 100);

// Implements the Readable interface.
const value = spring.get(); // Get the current value
const subscription = spring.subscribe((value) => {
  // Do something with the current value.
});
const $position = spring.as((x) => `${x}px`); // Transform to a new state.
```

## View animation API

```jsx
class ExampleView extends View {
  setup() {
    const opacity = makeSpring(0, { stiffness: 100, damping: 300 });
    const y = makeSpring(-20, { stiffness: 200, damping: 200 });

    // Runs when the view is connected.
    // Animate opacity and Y position, resolving when finished.
    ctx.animateIn(async () => Promise.all([opacity.to(1), y.to(0)]));

    // Runs before the view is disconnected. DOM removal upon resolution of promise.
    ctx.animateOut(async () => Promise.all([opacity.to(0), y.to(-20)]));

    return (
      <div style={{ opacity, transform: y.as((y) => `translateY(${y}px)`) }}>
        This is animated.
      </div>
    );
  },
}
```
