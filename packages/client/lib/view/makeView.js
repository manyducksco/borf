import { isFunction } from "../helpers/typeChecking.js";

export function makeView(...args) {
  // Args should be zero or more traits followed by a view function.
  const fn = args.pop();

  if (!isFunction(fn)) {
    throw new TypeError(`Expected a view function as the last argument. Got: ${fn}`);
  }

  fn._traits = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i]._trait) {
      fn._traits.push(args[i]);
    } else {
      throw new Error(
        `Argument at index ${i} is not a trait. Expected zero or more traits followed by a view function.`
      );
    }
  }

  return fn;
}
