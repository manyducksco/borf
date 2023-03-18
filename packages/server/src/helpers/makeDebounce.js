import { isNumber, isObject, isFunction } from "./typeChecking.js";

/**
 * Works one of two ways:
 *
 * 1. Takes a `timeout` and a `callback`, returns a function that fires `callback` `timeout` milliseconds after the last time it was called.
 * 2. Takes a `timeout` only, returns a function that takes another function and queues it.
 */

export function makeDebounce(...args) {
  const { timeout, callback, immediate } = parseArgs(args);
  let pending;

  const queue = (fn) => {
    const callNow = immediate && !pending;

    clearTimeout(pending);

    pending = setTimeout(() => {
      if (!callNow) fn();
      pending = undefined;
    }, timeout);

    if (callNow) fn();
  };

  if (callback) {
    return function () {
      queue(callback);
    };
  } else {
    return queue;
  }
}

function parseArgs(args) {
  let timeout;
  let callback;
  let immediate;

  if (args.length === 1 && isObject(args[0])) {
    // (config)
    const config = args[0];

    timeout = config.timeout;
    callback = config.callback;
    immediate = config.immediate;
  } else if (isNumber(args[0])) {
    if (args[1] == null) {
      // (timeout)
      timeout = args[0];
    } else if (isFunction(args[1])) {
      // (timeout, callback)
      timeout = args[0];
      callback = args[1];
    } else {
      throw new TypeError(`Expected either nothing or a callback function as the second parameter. Got: ${args[1]}`);
    }
  } else {
    throw new TypeError(`Expected either a config object or a timeout as a first parameter. Got: ${args[0]}`);
  }

  return { timeout, callback, immediate };
}
