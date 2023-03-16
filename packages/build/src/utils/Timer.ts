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

  #startedAt = this.#getNow();

  #getNow() {
    if (performance != null) {
      return performance.now();
    }

    return Date.now();
  }

  /**
   * Returns total time elapsed since last reset in milliseconds.
   */
  get elapsed() {
    return this.#getNow() - this.#startedAt;
  }

  /**
   * Returns the timer duration formatted as a string.
   */
  format() {
    return Timer.format(this.elapsed);
  }

  /**
   * Resets timer duration to 0.
   */
  reset() {
    this.#startedAt = this.#getNow();
  }
}
