import { View, makeSpring } from "@frameworke/fronte";

export class SpringExample extends View {
  static about = "Demonstrates the use of springs for animation.";

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
            transform: spring.as((current) => `translateX(${current}px)`), // Use the spring's value as the X coordinate of this marker.
          }}
        />
        <button
          onclick={() => {
            spring.to(0); // Animate to 0 based on spring parameters.
          }}
        >
          0px
        </button>
        <button
          onclick={() => {
            spring.to(100); // Animate to 100 based on spring parameters.
          }}
        >
          100px
        </button>
      </div>
    );
  }
}
