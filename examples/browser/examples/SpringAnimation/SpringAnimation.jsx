import { readable, spring, writable, computed } from "@borf/browser";
import dedent from "dedent";
import { ExampleFrame } from "../../views/ExampleFrame";

import styles from "./SpringAnimation.module.css";

/**
 * Demonstrates the use of Spring for animation.
 */
export function SpringAnimation(props, c) {
  const $$stiffness = writable(1549);
  const $$mass = writable(7);
  const $$damping = writable(83);
  const $$velocity = writable(14);

  const preset = (stiffness, mass, damping, velocity) => () => {
    $$stiffness.set(stiffness);
    $$mass.set(mass);
    $$damping.set(damping);
    $$velocity.set(velocity);
  };

  // Render the current settings as a code snippet to copy and paste.
  const $codeSnippet = computed(
    [$$stiffness, $$mass, $$damping, $$velocity],
    (s, m, d, v) => {
      return dedent`
        const $spring = spring(0, {
          stiffness: ${s},
          mass: ${m},
          damping: ${d},
          velocity: ${v}
        });
      `;
    }
  );

  const markup = (
    <ExampleFrame title="Spring Animation">
      <p>The shapes below are animated by one spring.</p>

      <Examples
        stiffness={$$stiffness}
        damping={$$damping}
        mass={$$mass}
        velocity={$$velocity}
      />

      <p>That spring's properties can be tweaked with the following sliders:</p>

      <div class={styles.controls}>
        <ControlGroup
          label="Stiffness"
          $$value={$$stiffness}
          min={0}
          max={2000}
        />
        <ControlGroup label="Mass" $$value={$$mass} min={1} max={50} />
        <ControlGroup label="Damping" $$value={$$damping} min={1} max={400} />
        <ControlGroup
          label="Velocity"
          $$value={$$velocity}
          min={-100}
          max={100}
        />
      </div>

      <p>Presets</p>

      <ul class={styles.presetList}>
        <li>
          <button class={styles.presetButton} onclick={preset(1845, 1, 28, 0)}>
            Clunky
          </button>
        </li>

        <li>
          <button class={styles.presetButton} onclick={preset(1354, 7, 66, 0)}>
            Marshmallowy
          </button>
        </li>

        <li>
          <button class={styles.presetButton} onclick={preset(2000, 5, 400, 3)}>
            Corporate
          </button>
        </li>

        <li>
          <button class={styles.presetButton} onclick={preset(648, 1, 28, 0)}>
            Punchy
          </button>
        </li>

        <li>
          <button class={styles.presetButton} onclick={preset(841, 41, 301, 0)}>
            Smooth
          </button>
        </li>
      </ul>

      <p style={{ marginBottom: "1rem" }}>
        Once you find the settings you like, plug those numbers into your code
        like so:
      </p>

      <pre>
        <code>{$codeSnippet}</code>
      </pre>
    </ExampleFrame>
  );

  return markup;
}

export function Examples(props, c) {
  const $stiffness = readable(props.stiffness); // Amount of stiffness or tension in the spring.
  const $mass = readable(props.mass); // How heavy the spring is.
  const $damping = readable(props.damping); // Amount of smoothing. Affects the speed of transitions.
  const $velocity = readable(props.velocity); // How much force the spring's motion begins with.

  const $spring = spring(0, {
    stiffness: $stiffness,
    mass: $mass,
    damping: $damping,
    velocity: $velocity,
  });

  const animate = async () => {
    return $spring
      .to(1)
      .then(() => $spring.to(0))
      .then(() => {
        animate();
      });
  };

  c.onConnected(() => {
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
            transform: computed($spring, (x) => `translateX(${x * 160 - 80}%)`),
          }}
        />
      </div>

      <div class={styles.exampleCanvas}>
        <div
          style={{
            position: "absolute",
            inset: "0 0.5rem",
            backgroundColor: "orange",
            transform: computed(
              $spring,
              (x) => `translateY(${90 - (1 - x) * 60}%)`
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
            transform: computed($spring, (x) => `scale(${0.5 + x})`),
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
            transform: computed($spring, (x) => `rotate(${45 + x * -90}deg)`),
          }}
        />
      </div>
    </div>
  );
}

function ControlGroup({ label, min, max, $$value }) {
  return (
    <div class={styles.controlGroup}>
      <label for={label}>
        <span>{label}</span>
        <span class={styles.controlLabel}>{$$value}</span>
      </label>

      <input
        class={styles.controlInput}
        id={label}
        type="range"
        min={min}
        max={max}
        value={$$value}
      />
    </div>
  );
}
