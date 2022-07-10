import { isObject } from "./typeChecking.js";

export async function initService(appContext, fn, debug, config) {
  const self = {
    debug,
    options: config.options || {},
    services: appContext.services,
  };

  let exports = await fn.call(self, self);

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
