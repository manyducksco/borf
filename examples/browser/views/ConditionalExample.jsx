import { View, makeState, makeSpring } from "@borf/browser";

export class ConditionalExample extends View {
  setup(ctx, m) {
    const $$show = makeState(false);
    const $label = $$show.map((t) => (t ? "Hide Text" : "Show Text"));

    return (
      <div class="example">
        <h3>
          Conditional rendering with <code>when()</code>
        </h3>
        <div>
          <button
            style={{
              width: 100,
            }}
            onclick={() => {
              $$show.update((t) => !t);
            }}
          >
            {$label}
          </button>

          {View.when($$show, <Message />)}
        </div>
      </div>
    );
  }
}

class Message extends View {
  setup(ctx, m) {
    const opacity = makeSpring(0, { stiffness: 200, damping: 50 });
    const y = makeSpring(-10, { stiffness: 200, damping: 50 });

    ctx.animateIn(() => Promise.all([opacity.to(1), y.to(0)]));
    ctx.animateOut(() => Promise.all([opacity.to(0), y.to(-10)]));

    return (
      <span
        style={{
          display: "inline-block",
          paddingLeft: "0.5rem",
          opacity: opacity,
          transform: y.map((y) => `translateY(${y}px)`),
        }}
      >
        Hello there!
      </span>
    );
  }
}
