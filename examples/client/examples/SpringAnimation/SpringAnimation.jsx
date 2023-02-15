import { View, Spring, State, Ref } from "woofe";
import { ExampleFrame } from "../../views/ExampleFrame";

import styles from "./SpringAnimation.module.css";

export class SpringAnimation extends View {
  static about = "Demonstrates the use of springs for animation.";
  static inputs = {};

  setup(ctx, m) {
    const $$stiffness = new State(1549);
    const $$mass = new State(7);
    const $$damping = new State(83);
    const $$velocity = new State(14);

    const preset = (stiffness, mass, damping, velocity) => () => {
      $$stiffness.set(stiffness);
      $$mass.set(mass);
      $$damping.set(damping);
      $$velocity.set(velocity);
    };

    const codeRef = new Ref();

    ctx.observe($$stiffness, $$mass, $$damping, $$velocity, (s, m, d, v) => {
      codeRef.element.textContent = `
const spring = makeSpring(0, {
  stiffness: ${s},
  mass: ${m},
  damping: ${d},
  velocity: ${v}
})
      `;
    });

    return (
      <ExampleFrame title="Spring Animation">
        <p>The shapes below are animated by the same spring.</p>

        <Examples
          stiffness={$$stiffness}
          damping={$$damping}
          mass={$$mass}
          velocity={$$velocity}
        />

        <p>
          That spring's properties can be tweaked with the following sliders:
        </p>

        <div class={styles.controls}>
          <ControlGroup
            label="Stiffness"
            value={$$stiffness}
            min={0}
            max={2000}
          />
          <ControlGroup label="Mass" value={$$mass} min={1} max={50} />
          <ControlGroup label="Damping" value={$$damping} min={1} max={400} />
          <ControlGroup
            label="Velocity"
            value={$$velocity}
            min={-100}
            max={100}
          />
        </div>

        <p>Presets:</p>

        <ul class={styles.presetList}>
          <li>
            <button
              class={styles.presetButton}
              onclick={preset(1845, 1, 28, 0)}
            >
              Clunky
            </button>
          </li>
          <li>
            <button
              class={styles.presetButton}
              onclick={preset(1354, 7, 66, 0)}
            >
              Marshmallowy
            </button>
          </li>
          <li>
            <button
              class={styles.presetButton}
              onclick={preset(2000, 5, 400, 3)}
            >
              Corporate
            </button>
          </li>
          <li>
            <button class={styles.presetButton} onclick={preset(648, 1, 28, 0)}>
              Punchy
            </button>
          </li>
          <li>
            <button
              class={styles.presetButton}
              onclick={preset(841, 41, 301, 0)}
            >
              Smooth
            </button>
          </li>
        </ul>

        <p>
          Once you find the settings you like, plug those numbers into your code
          like so:
        </p>

        <pre>
          <code ref={codeRef}></code>
        </pre>
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
    const $mass = ctx.inputs.readable("mass");
    const $damping = ctx.inputs.readable("damping");
    const $velocity = ctx.inputs.readable("velocity");

    const spring = new Spring(0, {
      stiffness: $stiffness,
      mass: $mass,
      damping: $damping,
      velocity: $velocity,
    });

    const animate = async () => {
      return spring
        .to(1)
        .then(() => spring.to(0))
        .then(() => {
          animate();
        });
    };

    ctx.afterConnect(() => {
      animate();
    });

    return (
      <div class={styles.examples}>
        <div class={styles.exampleCanvas}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              backgroundColor: "red",
              transform: spring.as((x) => `translateX(${x * 160 - 80}%)`),
            }}
          />
        </div>

        <div class={styles.exampleCanvas}>
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

        <div class={styles.exampleCanvas}>
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
