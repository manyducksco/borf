import { isFunction } from "../_helpers/typeChecking";
import { makeTestWrapper } from "./makeTestWrapper";

export function wrapService(service) {
  return makeTestWrapper((getService) => {
    if (service.isService) {
      const instance = new service(getService);

      if (isFunction(instance._created)) {
        instance._created();
      }

      return instance;
    } else {
      throw new Error(`Expected a Service. Received: ${service}`);
    }
  });
}
