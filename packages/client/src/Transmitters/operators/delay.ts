import { Subscribable, TransformFunc } from "../../types";
import { isSubscribable, subscribeTo } from "../../utils";

/**
 * Delays messages by `ms` milliseconds before sending them.
 *
 * @param ms - Amount of milliseconds to delay.
 */
export function delay<T>(
  ms: number | Subscribable<number>
): TransformFunc<T, T> {
  let time = 0;

  if (isSubscribable<number>(ms)) {
    subscribeTo(ms, (value) => {
      time = value;
    });
  } else {
    time = ms;
  }

  return (message, send) => {
    setTimeout(() => {
      send(message);
    }, time);
  };
}
