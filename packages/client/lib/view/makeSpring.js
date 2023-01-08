import { OBSERVABLE, READABLE } from "../keys.js";
import { makeState } from "../helpers/state.js";

export function makeSpring(initialValue = 0, options = {}) {
  const $$value = makeState(initialValue);

  const mass = options.mass ?? 1;
  const stiffness = options.stiffness ?? 100;
  const damping = options.damping ?? 10;
  const initialVelocity = options.initialVelocity ?? 0;

  let nextId = 0;
  let currentAnimationId;

  const spring = {
    async snapTo(value) {
      currentAnimationId = null;
      $$value.set(value);
    },
    async to(value, options) {
      // TODO: Snap if user agent prefers reduced motion

      return new Promise((resolve) => {
        const id = nextId++;
        const amplitude = makeAmplitudeMeasurer();
        const solve = makeSpringSolver(
          options?.mass ?? mass,
          options?.stiffness ?? stiffness,
          options?.damping ?? damping,
          options?.initialVelocity ?? initialVelocity
        );
        const startTime = Date.now();
        const startValue = $$value.get();

        currentAnimationId = id;

        function step() {
          if (currentAnimationId !== id) {
            resolve();
            return;
          }

          const elapsedTime = Date.now() - startTime;
          const proportion = solve(elapsedTime / 1000);

          $$value.set(startValue + (value - startValue) * proportion);

          // End animation when amplitude falls below threshold.
          amplitude.sample(proportion);
          if (amplitude.value && amplitude.value < 0.001) {
            currentAnimationId = null;
          }

          window.requestAnimationFrame(step);
        }

        window.requestAnimationFrame(step);
      });
    },
    async animate(startValue, endValue) {
      $$value.set(startValue);
      return spring.to(endValue);
    },
    get() {
      return $$value.get();
    },
    as(fn) {
      return $$value.as(fn);
    },
    subscribe(...args) {
      return $$value.subscribe(...args);
    },
  };

  Object.defineProperties(spring, {
    [OBSERVABLE]: {
      value: () => spring,
    },
    [READABLE]: {
      value: () => spring,
    },
  });

  return spring;
}

function makeSpringSolver(mass, stiffness, damping, initialVelocity) {
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));

  let wd;
  let A;
  let B;

  if (zeta < 1) {
    wd = w0 * Math.sqrt(1 - zeta * zeta);
    A = 1;
    B = (zeta * w0 + -initialVelocity) / wd;
  } else {
    wd = 0;
    A = 1;
    B = -initialVelocity + w0;
  }

  return function solve(t) {
    if (zeta < 1) {
      t = Math.exp(-t * zeta * w0) * (A * Math.cos(wd * t) + B * Math.sin(wd * t));
    } else {
      t = (A + B * t) * Math.exp(-t * w0);
    }

    return 1 - t;
  };
}

function makeAmplitudeMeasurer() {
  const samples = [];
  const resolution = 30;

  return {
    sample(value) {
      samples.push(value);

      while (samples.length > resolution) {
        samples.shift();
      }
    },

    get value() {
      if (samples.length < resolution) {
        return null;
      }

      return Math.max(...samples) - Math.min(...samples);
    },
  };
}
