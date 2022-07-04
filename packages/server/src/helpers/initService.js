import { isObject } from "./typeChecking.js";

export async function initService(app, fn, debug, config) {
  const getService = app.makeGetService({ identifier: config.name, type: "service" });

  const self = {
    debug,
    options: config.options || {},
    getService,
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
