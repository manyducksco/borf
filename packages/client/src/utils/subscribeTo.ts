import { Subscribable } from "../types";

/**
 * Easily subscribe and handle a value with an inline callback. Returns a cancel function.
 */
export function subscribeTo<T>(
  source: Subscribable<T>,
  callback: (value: T) => void
) {
  const sub = source.subscribe();

  sub.receiver.callback = callback;
  sub.receiver.callback(sub.initialValue);

  return sub.receiver.cancel.bind(sub.receiver);
}
