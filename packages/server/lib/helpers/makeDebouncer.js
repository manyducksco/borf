/**
 * Lets you queue a function to be called after `timeout` milliseconds.
 * Queuing another function cancels and replaces the queued function.
 * Queued functions can be cancelled if you want to prevent them from being called after the timeout.
 *
 * @param timeout - Number of milliseconds to wait before calling the queued function.
 * @param immediate - If true, run queued function right away if timeout has elapsed and nothing is pending.
 */
export function makeDebouncer(timeout, immediate = false) {
  let pending;

  return {
    /**
     * Queue a new function to be called after the timeout, replacing any existing queued function.
     *
     * @param fn - New pending function.
     */
    queue(fn) {
      const callNow = immediate && !pending;

      clearTimeout(pending);

      pending = setTimeout(() => {
        if (!callNow) fn();
        pending = undefined;
      }, timeout);

      if (callNow) fn();
    },

    /**
     * Cancels the queued function.
     */
    cancel() {
      clearTimeout(pending);
      pending = undefined;
    },
  };
}
