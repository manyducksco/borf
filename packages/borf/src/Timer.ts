/**
 * Times operations in code. Includes the ability to format duration into nearest unit of time for display.
 */
export class Timer {
  static format(ms: number) {
    if (ms % 1 > 0 && ms < 1) {
      return Math.round(ms * 1000) + "µs";
    }

    if (ms < 1000) {
      return Math.round(ms) + "ms";
    }

    if (ms < 60000) {
      return (ms / 1000).toFixed(1) + "s";
    }

    return (ms / 60000).toFixed(1) + "m";
  }

  #startedAt = this.#getNow(); // Start timer when instantiated.

  #getNow() {
    if (performance != null) {
      return performance.now();
    }

    return Date.now();
  }

  /**
   * Total time elapsed since last reset in milliseconds.
   */
  get elapsed() {
    return this.#getNow() - this.#startedAt;
  }

  /**
   * Timer duration formatted as a string.
   */
  get formatted() {
    return Timer.format(this.elapsed);
  }

  /**
   * Resets timer duration to 0.
   */
  reset() {
    this.#startedAt = this.#getNow();
  }

  /**
   * Timer duration formatted as a string.
   */
  toString() {
    return this.formatted;
  }
}
