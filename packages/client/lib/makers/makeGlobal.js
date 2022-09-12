import { isObject, isString } from "../helpers/typeChecking.js";
import { APP_CONTEXT } from "../keys.js";
import { makeState } from "./makeState.js";

import debug from "../globals/debug.js";

export function makeGlobal(fn, { appContext, name, channelPrefix }) {
  channelPrefix = channelPrefix || "global";

  // Lifecycle hook callbacks
  const onBeforeConnect = [];
  const onAfterConnect = [];

  // Subscriptions for observables observed through subscribeTo
  const subscriptions = [];

  // Exception because debug global doesn't exist yet when initializing the debug global.
  const channel = fn === debug ? {} : appContext.globals.debug.exports.channel(`${channelPrefix}:${name}`);
  const [state] = makeState({ debug: channel });

  const ctx = {
    [APP_CONTEXT]: appContext,

    ...channel,
    ...state,

    set defaultState(values) {
      // Set defaults only if they haven't been set already.
      for (const key in values) {
        if (state.get(key) === undefined) {
          state.set(key, values[key]);
        }
      }
    },

    get name() {
      return channel.name;
    },
    set name(value) {
      channel.name = `${channelPrefix}:${value}`;
    },

    global(name) {
      if (!isString(name)) {
        throw new TypeError("Expected a string.");
      }

      if (appContext.services[name]) {
        return appContext.services[name].exports;
      }

      throw new Error(`Global '${name}' is not registered on this app.`);
    },

    beforeConnect(callback) {
      onBeforeConnect.push(callback);
    },

    afterConnect(callback) {
      onAfterConnect.push(callback);
    },

    observe(...args) {
      const observer = state.observe(...args);
      subscriptions.push(observer.start());
    },
  };

  const exports = fn.call(ctx);

  if (!isObject(exports)) {
    throw new TypeError(`A global must return an object. Got: ${exports}`);
  }

  return {
    state,
    exports,
    beforeConnect() {
      for (const callback of onBeforeConnect) {
        callback();
      }
    },
    afterConnect() {
      for (const callback of onAfterConnect) {
        callback();
      }
    },
  };
}
