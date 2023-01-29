import { View, makeSpring, makeState } from "woofe";
import { ExampleFrame } from "../../views/ExampleFrame";

import styles from "./SpringAnimation.module.css";

export class SpringAnimation extends View {
  static about = "Demonstrates the use of springs for animation.";
  static attrs = {};

  setup(ctx, m) {
    const $$stiffness = makeState(550);
    const $$damping = makeState(30);
    const $$mass = makeState(1);
    const $$velocity = makeState(15);

    const spring = makeSpring(0, {
      stiffness: $$stiffness,
      damping: $$damping,
      mass: $$mass,
      velocity: $$velocity,
    });

    return (
      <ExampleFrame>
        <div>
          <h1>Spring Animation</h1>
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

          <div>
            <ControlGroup
              label="Stiffness"
              value={$$stiffness}
              min={0}
              max={2000}
            />
            <ControlGroup label="Damping" value={$$damping} min={0} max={400} />
            <ControlGroup label="Mass" value={$$mass} min={0} max={50} />
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

    // return m(ExampleFrame, [
    //   m("div", [
    //     m("h1", "Spring Animation"),
    //     m("div", {
    //       style: {
    //         width: 36,
    //         height: 36,
    //         borderRadius: "50%",
    //         backgroundColor: "red",
    //         transform: spring.as((current) => `translateX(${current}px)`), // Use the spring's value as the X coordinate of this marker.
    //       },
    //     }),

    //     m("button", { onclick: () => spring.to(0) }, "0px"),
    //     m("button", { onclick: () => spring.to(100) }, "100px"),

    //     m("div", [
    //       m(ControlGroup, {
    //         label: "Stiffness",
    //         value: $$stiffness,
    //         min: 0,
    //         max: 2000,
    //       }),
    //       m(ControlGroup, {
    //         label: "Damping",
    //         value: $$damping,
    //         min: 0,
    //         max: 1000,
    //       }),
    //       m(ControlGroup, {
    //         label: "Mass",
    //         value: $$mass,
    //         min: 0,
    //         max: 100,
    //       }),
    //     ]),
    //   ]),
    // ]);
  }
}

class ControlGroup extends View {
  static attrs = {
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

  setup({ attrs }, m) {
    const $label = attrs.readable("label");
    const $min = attrs.readable("min");
    const $max = attrs.readable("max");

    const $$value = attrs.writable("value");

    return (
      <div class={styles.controlGroup}>
        <label for="stiffness">{$label}</label>
        <div class={styles.controlSplit}>
          <input
            class={styles.controlInput}
            id="stiffness"
            type="range"
            min={$min}
            max={$max}
            value={$$value}
          />
          <span class={styles.controlLabel}>{$$value}</span>
        </div>
      </div>
    );

    // return m("div", { class: styles.controlGroup }, [
    //   m("label", { for: "stiffness" }, $label),
    //   m("div", { class: styles.controlSplit }, [
    //     m("input", {
    //       class: styles.controlInput,
    //       id: "stiffness",
    //       type: "range",
    //       min: $min,
    //       max: $max,
    //       value: $$value,
    //     }),
    //     m("span", { class: styles.controlLabel }, $$value),
    //   ]),
    // ]);
  }
}
