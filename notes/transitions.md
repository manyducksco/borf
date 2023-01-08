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

## Transition API

```jsx
const fadeInOut = makeTransitions((ctx) => {
  const opacity = makeSpring(0, {
    stiffness: 100,
    damping: 300,
  });
  const y = makeSpring(-20, {
    stiffness: 200,
    damping: 200,
  });

  // Runs when the view is connected.
  // Animate opacity and Y position, resolving when finished.
  ctx.enter(async () => Promise.all([opacity.to(1), y.to(0)]));

  // Runs before the view is disconnected. DOM removal upon resolution of promise.
  ctx.exit(async () => Promise.all([opacity.to(0), y.to(-20)]));

  // These are passed to the wrapped view as attributes.
  return { opacity, y };
});

const ExampleView = makeView(
  withName("ExampleView"),
  withTransitions(fadeInOut, (values) => {
    // This function maps fadeInOut's exports to CSS properties.
    // These properties will be applied to this view's `.node` automatically when this function is defined.
    return {
      opacity: values.opacity,
      transform: `translateY(${values.y}px)`,
    }
  }),
  () => <div>This is animated.</div>
);

// Apply to a view. View will receive exports as attributes.
<ExampleView transitions={fadeInOut} />

// Apply to an element. Takes a function to map props to CSS styles.
<div
  transitions={fadeInOut(({ opacity, y }) => ({
    opacity,
    transform: `translateY(${y}px)`,
  }))}
/>

const ExampleView = makeView((ctx) => {
  const attrs = ctx.attributes;

  // Props supplied by transition wrapper.
  const $opacity = attrs.readable("opacity");
  const $y = attrs.readable("y");

  return (
    <div
      style={{
        opacity: $opacity,
        transform: $y.as((y) => `translateY(${y}px)`),
      }}
    >
      I am animated
    </div>
  );

  const fadeInOutMapped = fadeInOut((attrs) => {
    return {
      opacity: attrs.opacity,
      transform: `translateY(${attrs.y}px)`;
    }
  });

  return <div transitions={fadeInOutMapped}>
    <span>This is content.</span>
  </div>
});

// TODO: Props passed to <AnimatedView> get forwarded to wrapped view.

// Animates when connected and disconnected.
// Attributes are passed to all children.
{<FadeInOut>
  <ExampleView />
  <ExampleView />
  <ExampleView />
  <ExampleView />
</FadeInOut>;}
```

## Tweens?

Maybe springs don't work for whatever case. Traditional tween animation with a similar API is possible.

```js
const tween = makeTween({
  duration: 300,
  easing: "easeInOut",
});

// Animate from 0 to 100
await tween.animate(0, 100);

// Also implements the Readable interface.
```
