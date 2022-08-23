import { isObject } from "./typeChecking.js";

export async function initService(appContext, fn, debug, config) {
  const ctx = {
    debug,
    options: config.options || {},
    services: appContext.services,
  };

  let exports = await fn(ctx);

  if (!isObject(exports)) {
    throw new TypeError(`A service must return an object. Got: ${exports}`);
  }

  const service = {
    exports,
  };

  Object.defineProperty(service, "isService", {
    value: true,
    writable: false,
  });

  return service;
}
