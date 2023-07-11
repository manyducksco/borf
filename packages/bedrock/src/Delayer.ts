export class Delayer {
  #callback?: () => unknown;
  #timeout?: any;

  /**
   * Calls `callback` after an amount of `milliseconds` has elapsed.
   * Calling this function again with another callback before the previous one's
   * time has elapsed will effectively cancel and replace the previous callback.
   */
  delay(milliseconds: number, callback: () => unknown) {
    this.cancel();
    this.#callback = callback;
    this.#timeout = setTimeout(() => {
      this.trigger();
    }, milliseconds);
  }

  /**
   * If there is a delayed callback whose timer hasn't yet elapsed, call it now.
   */
  trigger() {
    this.#callback?.();
    this.cancel();
  }

  /**
   * If there is a delayed callback whose timer hasn't yet elapsed, prevent calling it.
   */
  cancel() {
    if (this.#timeout) {
      clearTimeout(this.#timeout);
    }
    this.#callback = undefined;
    this.#timeout = undefined;
  }
}
