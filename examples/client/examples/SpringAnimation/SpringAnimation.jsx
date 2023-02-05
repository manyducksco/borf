import { View, makeSpring, makeState } from "woofe";
import { ExampleFrame } from "../../views/ExampleFrame";

import styles from "./SpringAnimation.module.css";

export class SpringAnimation extends View {
  static about = "Demonstrates the use of springs for animation.";
  static inputs = {};

  setup(ctx, m) {
    const $$stiffness = makeState(1549);
    const $$mass = makeState(7);
    const $$damping = makeState(83);
    const $$velocity = makeState(14);

    return (
      <ExampleFrame
        title="Spring Animation"
        about="Move sliders to adjust spring parameters."
      >
        <div class={styles.layout}>
          <div style={{ marginRight: "1rem" }}>
            <Examples
              stiffness={$$stiffness}
              damping={$$damping}
              mass={$$mass}
              velocity={$$velocity}
            />
          </div>

          <div class={styles.controls}>
            <ControlGroup
              label="Tension"
              value={$$stiffness}
              min={0}
              max={2000}
            />
            <ControlGroup label="Weight" value={$$mass} min={1} max={50} />
            <ControlGroup label="Damping" value={$$damping} min={1} max={400} />
            <ControlGroup
              label="Velocity"
              value={$$velocity}
              min={-100}
              max={100}
            />
          </div>
        </div>
      </ExampleFrame>
    );
  }
}

class Examples extends View {
  static inputs = {
    stiffness: {
      type: "number",
    },
    damping: {
      damping: "number",
    },
    mass: {
      type: "number",
    },
    velocity: {
      type: "number",
    },
  };

  setup(ctx, m) {
    const $stiffness = ctx.inputs.readable("stiffness");
    const $damping = ctx.inputs.readable("damping");
    const $mass = ctx.inputs.readable("mass");
    const $velocity = ctx.inputs.readable("velocity");

    const spring = makeSpring(0, {
      stiffness: $stiffness,
      damping: $damping,
      mass: $mass,
      velocity: $velocity,
    });

    const animate = async () => {
      return spring
        .to(1)
        .then(() => spring.to(0))
        .then(() => animate());
    };

    ctx.afterConnect(() => {
      animate();
    });

    const $$tab = makeState(1);

    return (
      <div class={styles.examples}>
        <div class={styles.exampleCanvas}>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              backgroundColor: "red",
              transform: spring.as((x) => `translateX(${x * 250 - 125}%)`),
            }}
          />
        </div>

        <div class={styles.exampleCanvas} style={{ overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              inset: "0 0.5rem",
              backgroundColor: "orange",
              transform: spring.as(
                (current) => `translateY(${90 - (1 - current) * 60}%)`
              ),
            }}
          />
        </div>

        <div class={styles.exampleCanvas}>
          <div
            style={{
              position: "absolute",
              width: 36,
              height: 36,
              backgroundColor: "purple",
              transform: spring.as((x) => `scale(${0.5 + x * 1})`),
            }}
          />
        </div>

        <div class={styles.exampleCanvas} style={{ overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              width: 2,
              height: 60,
              backgroundColor: "white",
              transformOrigin: "bottom center",
              transform: spring.as((x) => `rotate(${45 + x * -90}deg)`),
            }}
          />
        </div>
      </div>
    );
  }
}

class ControlGroup extends View {
  static inputs = {
    label: {
      type: "string",
      required: true,
    },
    value: {
      type: "number",
      required: true,
      writable: true,
    },
    min: {
      type: "number",
      required: true,
    },
    max: {
      type: "number",
      required: true,
    },
  };

  setup(ctx, m) {
    const $label = ctx.inputs.readable("label");
    const $min = ctx.inputs.readable("min");
    const $max = ctx.inputs.readable("max");

    const $$value = ctx.inputs.writable("value");

    return (
      <div class={styles.controlGroup}>
        <label for={$label}>
          <span>{$label}</span>
          <span class={styles.controlLabel}>{$$value}</span>
        </label>

        <input
          class={styles.controlInput}
          id={$label}
          type="range"
          min={$min}
          max={$max}
          value={$$value}
        />
      </div>
    );
  }
}
