import { isState } from "./isState.js";
import { isObject } from "./utils.js";

export function makeGetters(...args) {
  let state;
  let getters;

  if (isState(args[0])) {
    state = args.shift();
  }

  if (isObject(args[0])) {
    getters = args.shift();
  }

  const factory = function (state) {
    const wrapped = {};

    for (const name in getters) {
      wrapped[name] = (...args) => {
        return getters[name](state.get(), ...args);
      };
    }

    return wrapped;
  };

  if (state) {
    return factory(state);
  }

  return factory;
}
