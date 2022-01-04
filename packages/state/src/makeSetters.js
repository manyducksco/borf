import { isState } from "./isState.js";
import { isObject } from "./utils.js";

export function makeSetters(...args) {
  let state;
  let setters;

  if (isState(args[0])) {
    state = args.shift();
  }

  if (isObject(args[0])) {
    setters = args.shift();
  }

  const factory = function (state) {
    const wrapped = {};

    for (const name in setters) {
      wrapped[name] = (...args) => {
        state.set((current) => {
          return setters[name](current, ...args);
        });
      };
    }

    return wrapped;
  };

  if (state) {
    return factory(state);
  }

  return factory;
}
