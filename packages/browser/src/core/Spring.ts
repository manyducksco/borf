import { type Readable, writable, unwrap } from "./state.js";

interface SpringOptions {
  /**
   * How heavy the spring is.
   */
  mass?: number | Readable<number>;

  /**
   * Amount of stiffness or tension in the spring.
   */
  stiffness?: number | Readable<number>;

  /**
   * Amount of smoothing. Affects the speed of transitions.
   */
  damping?: number | Readable<number>;

  /**
   * How much force the spring's motion begins with.
   */
  velocity?: number | Readable<number>;
}

export interface Spring extends Readable<number> {
  to(newValue: number, options?: SpringOptions): Promise<void>;

  snapTo(newValue: number): Promise<void>;

  animate(startValue: number, endValue: number, options?: SpringOptions): Promise<void>;
}

export function spring(initialValue: number, options?: SpringOptions): Spring {
  const mass = options?.mass ?? 2;
  const stiffness = options?.stiffness ?? 1200;
  const damping = options?.damping ?? 160;
  const velocity = options?.velocity ?? 5;

  const $$currentValue = writable(initialValue);

  let nextId = 0;
  let currentAnimationId: number | undefined;

  const snapTo = async (newValue: number) => {
    currentAnimationId = undefined;
    $$currentValue.set(newValue);
  };

  const to = async (endValue: number, options?: SpringOptions) => {
    // Act like snap if user prefers reduced motion.
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      return snapTo(endValue);
    }

    return new Promise<void>((resolve) => {
      const id = nextId++;
      const amplitude = makeAmplitudeMeasurer();
      const solve = makeSpringSolver({
        mass: options?.mass ?? mass,
        stiffness: options?.stiffness ?? stiffness,
        damping: options?.damping ?? damping,
        velocity: options?.velocity ?? velocity,
      });
      const startTime = Date.now();
      const startValue = $$currentValue.get();

      const step = () => {
        if (currentAnimationId !== id) {
          resolve();
          return;
        }

        const elapsedTime = Date.now() - startTime;
        const proportion = solve(elapsedTime / 1000);

        $$currentValue.set(startValue + (endValue - startValue) * proportion);

        // End animation when amplitude falls below threshold.
        amplitude.sample(proportion);
        if (amplitude.value && amplitude.value < 0.001) {
          currentAnimationId = undefined;
          $$currentValue.set(endValue);
        }

        window.requestAnimationFrame(step);
      };

      currentAnimationId = id;
      window.requestAnimationFrame(step);
    });
  };

  const animate = async (startValue: number, endValue: number, options?: SpringOptions) => {
    // Act like snap if user prefers reduced motion.
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      return snapTo(endValue);
    }

    return snapTo(startValue).then(() => to(endValue, options));
  };

  return {
    get: $$currentValue.get,
    observe: $$currentValue.observe,
    to,
    snapTo,
    animate,
  };
}

function makeSpringSolver(options: Required<SpringOptions>) {
  return function solve(t: number) {
    // Unwrapping the variables each time allows readable values to change as the spring is animating.
    const mass = unwrap(options.mass);
    const stiffness = unwrap(options.stiffness);
    const damping = unwrap(options.damping);
    const initialVelocity = unwrap(options.velocity);

    const dampingRatio = damping / (2 * Math.sqrt(stiffness * mass));
    const speed = Math.sqrt(stiffness / mass);

    let B: number;
    let position: number;

    if (dampingRatio < 1) {
      const dampedSpeed = speed * Math.sqrt(1 - dampingRatio * dampingRatio);
      B = (dampingRatio * speed + -initialVelocity) / dampedSpeed;

      position = (Math.cos(dampedSpeed * t) + B * Math.sin(dampedSpeed * t)) * Math.exp(-t * speed * dampingRatio);
    } else {
      B = speed + -initialVelocity;

      position = (1 + B * t) * Math.exp(-t * speed);
    }

    return 1 - position;
  };
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
