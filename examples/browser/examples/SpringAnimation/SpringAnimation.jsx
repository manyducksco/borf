import { View, Spring, Writable, Ref } from "@borf/browser";
import { ExampleFrame } from "../../views/ExampleFrame";

import styles from "./SpringAnimation.module.css";

export const SpringAnimation = View.define({
  label: "SpringAnimation",
  about: "Demonstrates the use of springs for animation.",

  setup(ctx, m) {
    const $$stiffness = new Writable(1549);
    const $$mass = new Writable(7);
    const $$damping = new Writable(83);
    const $$velocity = new Writable(14);

    const preset = (stiffness, mass, damping, velocity) => () => {
      $$stiffness.value = stiffness;
      $$mass.value = mass;
      $$damping.value = damping;
      $$velocity.value = velocity;
    };

    const codeRef = new Ref();

    ctx.observe([$$stiffness, $$mass, $$damping, $$velocity], (s, m, d, v) => {
      codeRef.element.textContent = `
const spring = new Spring(0, {
  stiffness: ${s},
  mass: ${m},
  damping: ${d},
  velocity: ${v}
});
      `;
    });

    return (
      <ExampleFrame title="Spring Animation">
        <p>The shapes below are animated by a single spring.</p>

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
  },
});

const Examples = View.define({
  label: "Examples",
  inputs: {
    stiffness: {
      about: "Amount of stiffness or tension in the spring.",
      example: 800,
    },
    damping: {
      about: "Amount of smoothing. Affects the speed of transitions.",
      example: 50,
    },
    mass: {
      about: "How heavy the spring is.",
      example: 4,
    },
    velocity: {
      about: "How much force the spring's motion begins with.",
      example: 15,
    },
  },

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

    ctx.onConnect(() => {
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
              transform: spring.map((x) => `translateX(${x * 160 - 80}%)`),
            }}
          />
        </div>

        <div class={styles.exampleCanvas}>
          <div
            style={{
              position: "absolute",
              inset: "0 0.5rem",
              backgroundColor: "orange",
              transform: spring.map(
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
              transform: spring.map((x) => `scale(${0.5 + x * 1})`),
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
              transform: spring.map((x) => `rotate(${45 + x * -90}deg)`),
            }}
          />
        </div>
      </div>
    );
  },
});

const ControlGroup = View.define({
  label: "ControlGroup",
  inputs: {
    label: {
      about: "Name to display for this control",
      example: "Velocity",
    },
    value: {
      about: "Current value for this control",
      example: 12,
      writable: true,
    },
    min: {
      about: "The smallest allowed value",
      example: 0,
    },
    max: {
      about: "The largest allowed value",
      example: 100,
    },
  },

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
  },
});
