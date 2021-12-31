import { makeState, mapState } from "./makeState.js";

/**
 * Takes any number of states followed by a function. This function takes the states as arguments
 * and returns a new value for this state whenever any of the dependent states gets a new value.
 */
export function combineStates(...args) {
  const combine = args.pop();
  const states = args;
  const watchers = [];

  const initialValue = combine(...states.map(toValue));
  const value = makeState(initialValue);

  for (const state of states) {
    watchers.push(
      state.watch(() => {
        value.set(combine(...states.map(toValue)));
      })
    );
  }

  return {
    get isState() {
      return true;
    },

    get() {
      return value.get();
    },

    watch(callback) {
      return value.watch(callback);
    },

    map(transform) {
      return mapState(this, transform);
    },

    toString() {
      return value.toString();
    },
  };
}

const toValue = (state) => state.get();
