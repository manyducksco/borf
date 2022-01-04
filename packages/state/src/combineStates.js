import { getProperty } from "./getProperty.js";
import { mapState } from "./makeState.js";

export function combineStates(...args) {
  const combine = args.pop();
  const states = args;

  return {
    get(key) {
      const value = combine(...states.map((state) => state.get()));

      if (key !== undefined) {
        return getProperty(value, key);
      } else {
        return value;
      }
    },

    watch(callback) {
      const watchers = [];

      for (const state of states) {
        watchers.push(
          state.watch(() => {
            callback(this.get());
          })
        );
      }

      return function unwatch() {
        for (const unwatch of watchers) {
          unwatch();
        }
      };
    },

    map(transform) {
      return mapState(this, transform);
    },

    toString() {
      return String(this.get());
    },

    get isState() {
      return true;
    },
  };
}
