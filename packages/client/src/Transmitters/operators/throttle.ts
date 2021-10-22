import { Subscribable, TransformFunc } from "../../types";
import { isSubscribable, subscribeTo } from "../../utils";

/**
 * Ignores all messages for `ms` milliseconds after a value is sent.
 *
 * @param ms - amount of milliseconds to wait
 */
export function throttle<T>(
  ms: number | Subscribable<number>
): TransformFunc<T, T> {
  let next = 0;
  let time = 0;

  if (isSubscribable<number>(ms)) {
    subscribeTo(ms, (value) => {
      time = value;
    });
  } else {
    time = ms;
  }

  return (message, send) => {
    const now = Date.now();

    if (now >= next) {
      send(message);
      next = now + time;
    }
  };
}
