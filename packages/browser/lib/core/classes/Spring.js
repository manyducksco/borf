import { State } from "./State.js";
import { OBSERVABLE, READABLE } from "../keys.js";

export class Spring {
  static isSpring(value) {
    return value instanceof Spring;
  }

  #$$value;

  #mass;
  #stiffness;
  #damping;
  #velocity;

  #nextId = 0;
  #currentAnimationId;

  constructor(initialValue = 0, options = {}) {
    this.#$$value = new State(initialValue);

    this.#mass = options.mass ?? 1;
    this.#stiffness = options.stiffness ?? 100;
    this.#damping = options.damping ?? 10;
    this.#velocity = options.velocity ?? 0;
  }

  async snapTo(value) {
    this.#currentAnimationId = null;
    this.#$$value.set(value);
  }

  async to(value, options) {
    // Act like snap if user prefers reduced motion.
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      return this.snapTo(value);
    }

    return new Promise((resolve) => {
      const id = this.#nextId++;
      const amplitude = makeAmplitudeMeasurer();
      const solver = new SpringSolver({
        mass: options?.mass ?? this.#mass,
        stiffness: options?.stiffness ?? this.#stiffness,
        damping: options?.damping ?? this.#damping,
        velocity: options?.velocity ?? this.#velocity,
      });
      const startTime = Date.now();
      const startValue = this.#$$value.get();

      const step = () => {
        if (this.#currentAnimationId !== id) {
          resolve();
          return;
        }

        const elapsedTime = Date.now() - startTime;
        const proportion = solver.solve(elapsedTime / 1000);

        this.#$$value.set(startValue + (value - startValue) * proportion);

        // End animation when amplitude falls below threshold.
        amplitude.sample(proportion);
        if (amplitude.value && amplitude.value < 0.001) {
          this.#currentAnimationId = null;
        }

        window.requestAnimationFrame(step);
      };

      this.#currentAnimationId = id;
      window.requestAnimationFrame(step);
    });
  }

  async animate(startValue, endValue) {
    this.#$$value.set(startValue);
    return this.to(endValue);
  }

  get() {
    return this.#$$value.get();
  }

  map(fn) {
    return this.#$$value.map(fn);
  }

  subscribe(...args) {
    return this.#$$value.subscribe(...args);
  }

  [OBSERVABLE]() {
    return this;
  }

  [READABLE]() {
    return this;
  }
}

class StaticReadable {
  #value;

  constructor(value) {
    this.#value = value;
  }

  get() {
    return this.#value;
  }
}

class SpringSolver {
  constructor({ mass, stiffness, damping, velocity }) {
    this.$mass = State.isReadable(mass) ? mass : new StaticReadable(mass);
    this.$stiffness = State.isReadable(stiffness) ? stiffness : new StaticReadable(stiffness);
    this.$damping = State.isReadable(damping) ? damping : new StaticReadable(damping);
    this.$velocity = State.isReadable(velocity) ? velocity : new StaticReadable(velocity);
  }

  solve(t) {
    // Getting the variables each time allows the values to change as the spring is animating.
    const mass = this.$mass.get();
    const stiffness = this.$stiffness.get();
    const damping = this.$damping.get();
    const velocity = this.$velocity.get();

    const dampingRatio = damping / (2 * Math.sqrt(stiffness * mass));
    const undampedAngularFreq = Math.sqrt(stiffness / mass);

    let angularFreq;
    let A = 1;
    let B;

    if (dampingRatio < 1) {
      angularFreq = undampedAngularFreq * Math.sqrt(1 - dampingRatio * dampingRatio);
      B = (dampingRatio * undampedAngularFreq + -velocity) / angularFreq;

      t =
        Math.exp(-t * dampingRatio * undampedAngularFreq) *
        (A * Math.cos(angularFreq * t) + B * Math.sin(angularFreq * t));
    } else {
      angularFreq = 0;
      B = -velocity + undampedAngularFreq;

      t = (A + B * t) * Math.exp(-t * undampedAngularFreq);
    }

    return 1 - t;
  }
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
