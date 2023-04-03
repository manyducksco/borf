/**
 * The simplest possible publish/subscribe mechanism.
 */
export class PubSub<T = any> {
  #subscribers: ((value: T) => void)[] = [];

  /**
   * Publishes a value to all subscribers.
   *
   * @param value - The value to publish.
   */
  publish(value: T) {
    for (const subscriber of this.#subscribers) {
      subscriber(value);
    }
  }

  /**
   * Subscribes to values published by this PubSub. Returns an unsubscribe function.
   *
   * @param callback - The callback to call when a value is published.
   */
  subscribe(callback: (value: T) => void) {
    const subs = this.#subscribers;
    subs.push(callback);

    return function unsubscribe() {
      subs.splice(subs.indexOf(callback), 1);
    };
  }
}
