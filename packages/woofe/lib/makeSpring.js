import { OBSERVABLE, READABLE } from "./keys.js";
import { makeState } from "./makeState.js";

export function makeSpring(initialValue = 0, options = {}) {
  const $$value = makeState(initialValue);

  const mass = options.mass ?? 1;
  const stiffness = options.stiffness ?? 100;
  const damping = options.damping ?? 10;
  const velocity = options.velocity ?? 0;

  let nextId = 0;
  let currentAnimationId;

  const spring = {
    async snapTo(value) {
      currentAnimationId = null;
      $$value.set(value);
    },

    async to(value, options) {
      // TODO: Act like snap if user prefers reduced motion

      return new Promise((resolve) => {
        const id = nextId++;
        const amplitude = makeAmplitudeMeasurer();
        const solve = makeSpringSolver(
          options?.mass ?? mass,
          options?.stiffness ?? stiffness,
          options?.damping ?? damping,
          options?.velocity ?? velocity
        );
        const startTime = Date.now();
        const startValue = $$value.get();

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

        currentAnimationId = id;
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

// Adapted from the Webkit spring solver JS implementation: https://webkit.org/demos/spring/
function makeSpringSolver(mass, stiffness, damping, velocity) {
  const dampingRatio = damping / (2 * Math.sqrt(stiffness * mass));
  const undampedAngularFreq = Math.sqrt(stiffness / mass);

  let angularFreq;
  let A;
  let B;

  if (dampingRatio < 1) {
    angularFreq = undampedAngularFreq * Math.sqrt(1 - dampingRatio * dampingRatio);
    A = 1;
    B = (dampingRatio * undampedAngularFreq + -velocity) / angularFreq;
  } else {
    angularFreq = 0;
    A = 1;
    B = -velocity + undampedAngularFreq;
  }

  // TODO: Calculate end of animation?

  return function solve(t) {
    if (dampingRatio < 1) {
      t =
        Math.exp(-t * dampingRatio * undampedAngularFreq) *
        (A * Math.cos(angularFreq * t) + B * Math.sin(angularFreq * t));
    } else {
      t = (A + B * t) * Math.exp(-t * undampedAngularFreq);
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
