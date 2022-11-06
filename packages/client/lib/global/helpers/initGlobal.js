import { APP_CONTEXT } from "../../keys.js";
import { isObject, isObservable, isString } from "../../helpers/typeChecking.js";
import { makeWritable } from "../../state/makeWritable.js";
import { makeMerged } from "../../state/makeMerged.js";

export function initGlobal(fn, config) {
  let { appContext, name, channelPrefix } = config;

  channelPrefix = channelPrefix || "global";

  const beforeConnectCallbacks = [];
  const afterConnectCallbacks = [];

  const channel = appContext.debug.makeChannel(`${channelPrefix}:${name}`);

  const ctx = {
    [APP_CONTEXT]: appContext,

    state(initialValue) {
      return makeWritable(initialValue);
    },

    merge(...args) {
      return makeMerged(...args);
    },

    observe(...args) {
      let callback = args.pop();

      if (isObservable(args.at(0))) {
        const $merged = makeMerged(...args, callback);
        $merged.subscribe(() => undefined);
      } else {
        const $merged = makeMerged(...args, () => undefined);
        $merged.subscribe(callback);
      }
    },

    global(name) {
      if (!isString(name)) {
        throw new TypeError("Expected a string.");
      }

      if (appContext.globals[name]) {
        return appContext.globals[name].exports;
      }

      throw new Error(`Global '${name}' is not registered on this app.`);
    },

    beforeConnect(callback) {
      beforeConnectCallbacks.push(callback);
    },

    afterConnect(callback) {
      afterConnectCallbacks.push(callback);
    },
  };

  // Add debug channel methods.
  Object.defineProperties(ctx, Object.getOwnPropertyDescriptors(channel));
  Object.defineProperties(ctx, {
    name: {
      get() {
        return channel.name;
      },
      set(value) {
        channel.name = `${channelPrefix}:${value}`;
      },
    },
  });

  const exports = fn(ctx);

  if (!isObject(exports)) {
    throw new TypeError(`A global must return an object. Got: ${exports}`);
  }

  return {
    exports,
    beforeConnect() {
      for (const callback of beforeConnectCallbacks) {
        callback();
      }
    },
    afterConnect() {
      for (const callback of afterConnectCallbacks) {
        callback();
      }
    },
  };
}
