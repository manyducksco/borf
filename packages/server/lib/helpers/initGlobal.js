import { isObject, isString } from "./typeChecking.js";

export async function initGlobal(fn, { appContext, name }) {
  const channel = appContext.debug.makeChannel(`global:${name}`);

  const ctx = {
    global(name) {
      if (!isString(name)) {
        throw new TypeError("Expected a string.");
      }

      if (appContext.globals[name]) {
        return appContext.globals[name].exports;
      }

      throw new Error(`Global '${name}' is not registered on this app.`);
    },
  };

  // Copy channel methods, getters and setters.
  Object.defineProperties(ctx, Object.getOwnPropertyDescriptors(channel));

  let exports = await fn(ctx);

  if (!isObject(exports)) {
    throw new TypeError(`A global must return an object. Got: ${exports}`);
  }

  const global = {
    exports,
  };

  Object.defineProperty(global, "isGlobal", {
    value: true,
    writable: false,
  });

  return global;
}
