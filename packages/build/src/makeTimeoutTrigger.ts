/**
 * Returns a function that either runs the callback, or, if the callback is currently running,
 * queues the callback to run again as soon as it is finished.
 */
export function makeTimeoutTrigger(
  callback: () => Promise<void>,
  timeout: number
) {
  let timer: any;
  let queued = false;
  let running = false;

  async function run() {
    running = true;

    clearTimeout(timer);
    timer = null;

    await callback();

    running = false;

    if (queued) {
      queued = false;
      timer = setTimeout(run, timeout);
    }
  }

  return function trigger() {
    if (running) {
      queued = true;
    } else if (timer == null) {
      timer = setTimeout(run, timeout);
    }
  };
}
