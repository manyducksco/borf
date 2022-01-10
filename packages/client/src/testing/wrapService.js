import { isFunction } from "../helpers/typeChecking.js";
import { makeTestWrapper } from "./makeTestWrapper.js";

export function wrapService(service) {
  return makeTestWrapper((getService, options) => {
    if (service.isService) {
      const instance = new service(getService);

      if (isFunction(instance._created)) {
        instance._created(options);
      }

      return instance;
    } else {
      throw new Error(`Expected a Service. Received: ${service}`);
    }
  });
}
