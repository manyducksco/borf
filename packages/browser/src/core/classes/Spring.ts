import { Readable, Writable } from "./Writable.js";

interface SpringOptions {
  /**
   * Starting value of the spring. Defaults to 0.
   */
  initialValue?: number;

  /**
   * How heavy the spring is.
   */
  mass?: number;

  /**
   * Amount of stiffness or tension in the spring.
   */
  stiffness?: number;

  /**
   * Amount of smoothing. Affects the speed of transitions.
   */
  damping?: number;

  /**
   * How much force the spring's motion begins with.
   */
  velocity?: number;
}

export class Spring extends Readable<number> {
  /**
   * Determines if an object is a Spring.
   */
  static isSpring(value: unknown): value is Spring {
    return value instanceof Spring;
  }

  #current;

  #mass;
  #stiffness;
  #damping;
  #velocity;

  #nextId = 0;
  #currentAnimationId?: number;

  constructor(options: SpringOptions = {}) {
    const initialValue = options.initialValue ?? 0;

    super(initialValue);

    this.#current = new Writable(initialValue);

    this.#mass = options.mass ?? 1;
    this.#stiffness = options.stiffness ?? 100;
    this.#damping = options.damping ?? 10;
    this.#velocity = options.velocity ?? 0;
  }

  /**
   * Sets the Spring's value without animating.
   */
  async snapTo(value: number) {
    this.#currentAnimationId = undefined;
    this.#current.value = value;
  }

  /**
   * Animate from the current value to a new value. Returns a Promise that resolves when the transition is finished.
   */
  async to(value: number, options?: SpringOptions) {
    // Act like snap if user prefers reduced motion.
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      return this.snapTo(value);
    }

    return new Promise<void>((resolve) => {
      const id = this.#nextId++;
      const amplitude = makeAmplitudeMeasurer();
      const solver = new SpringSolver({
        mass: options?.mass ?? this.#mass,
        stiffness: options?.stiffness ?? this.#stiffness,
        damping: options?.damping ?? this.#damping,
        velocity: options?.velocity ?? this.#velocity,
      });
      const startTime = Date.now();
      const startValue = this.#current.value;

      const step = () => {
        if (this.#currentAnimationId !== id) {
          resolve();
          return;
        }

        const elapsedTime = Date.now() - startTime;
        const proportion = solver.solve(elapsedTime / 1000);

        this.#current.value = startValue + (value - startValue) * proportion;

        // End animation when amplitude falls below threshold.
        amplitude.sample(proportion);
        if (amplitude.value && amplitude.value < 0.001) {
          this.#currentAnimationId = undefined;
        }

        window.requestAnimationFrame(step);
      };

      this.#currentAnimationId = id;
      window.requestAnimationFrame(step);
    });
  }

  /**
   * Animate from a set starting value to an ending value. Returns a Promise that resolves when the transition is finished.
   */
  async animate(startValue: number, endValue: number) {
    this.#current.value = startValue;
    return this.to(endValue);
  }

  /**
   * Current value of the spring.
   */
  get value() {
    return this.#current.value;
  }

  get() {
    return this.value;
  }

  map<R>(transform: (value: number) => R): Readable<R> {
    return this.#current.map(transform);
  }

  observe(callback: (value: number) => void) {
    return this.#current.observe(callback);
  }
}

class SpringSolver {
  $mass: Readable<number>;
  $stiffness: Readable<number>;
  $damping: Readable<number>;
  $velocity: Readable<number>;

  constructor({ mass, stiffness, damping, velocity }: Required<Omit<SpringOptions, "initialValue">>) {
    this.$mass = new Readable(mass);
    this.$stiffness = new Readable(stiffness);
    this.$damping = new Readable(damping);
    this.$velocity = new Readable(velocity);
  }

  solve(t: number) {
    // Getting the variables each time allows the values to change as the spring is animating.
    const mass = this.$mass.value;
    const stiffness = this.$stiffness.value;
    const damping = this.$damping.value;
    const velocity = this.$velocity.value;

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
  const samples: number[] = [];
  const resolution = 30;

  return {
    sample(value: number) {
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