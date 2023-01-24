import { View, makeSpring } from "woofe";

export class SpringExample extends View {
  setup(ctx) {
    const spring = makeSpring(0, {
      stiffness: 50,
      damping: 10,
      mass: 1,
    });

    return (
      <div>
        Spring
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            backgroundColor: "red",
            transform: spring.as((current) => `translateX(${current}px)`),
          }}
        />
        <button
          onclick={() => {
            spring.to(0);
          }}
        >
          0px
        </button>
        <button
          onclick={() => {
            spring.to(100);
          }}
        >
          100px
        </button>
      </div>
    );
  }
}
