# Transitions

Transitions can be a lot better than they are in their current form. There are two pieces; spring animations and a reworked transition API.

## Spring Animations

Transition animations should be easy. Spring animations are pretty intuitive once you see them in action. Using springs means you can think only about what value you need to animate to and the spring handles the rest.

```js
const spring = makeSpring(0, {
  stiffness: 100,
  damping: 300,
});

// Manipulate values. Values animate based on spring options unless the `animate` option is false. Use this to set an initial value to animate from.
await spring.to(-100, { animate: false });

await spring.animate(-100);

// Promise resolves when the animation reaches its end.
await spring.to(100);

await spring.snap(100);

// Implements the Readable interface.
const value = spring.get(); // Get the current value
const subscription = spring.subscribe((value) => {
  // Do something with the current value.
});
const $position = spring.as((x) => `${x}px`); // Transform to a new state.
```

## Transition API

```js
const makeAnimated = makeTransitions((ctx) => {
  const opacity = makeSpring(0, {
    stiffness: 100,
    damping: 300,
  });
  const y = makeSpring(-20, {
    stiffness: 200,
    damping: 200,
  });

  // Runs when the view is connected.
  ctx.enter(async () => {
    // Animate opacity and Y position, resolving when finished.
    return Promise.all([opacity.to(1), y.to(0)]);
  });

  // Runs before the view is disconnected. DOM removal upon resolution of promise.
  ctx.exit(async () => {
    return Promise.all([opacity.to(0), y.to(-20)]);
  });

  // These are passed to the wrapped view as attributes.
  return {
    $opacity: opacity,
    $y: y,
  };
});

const ExampleView = makeView((ctx) => {
  // Attributes from transition wrapper.
  const { $opacity, $y } = ctx.attributes;

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
});

const AnimatedView = makeAnimated(ExampleView);

// Animates when connected and disconnected.
<AnimatedView />;
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
