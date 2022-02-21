import { isFunction, isService } from "../helpers/typeChecking.js";
import { makeTestWrapper } from "./makeTestWrapper.js";

export function wrapService(service, configure) {
  return makeTestWrapper(configure, (getService, options) => {
    if (isService(service)) {
      const instance = service.create({
        getService,
        debugChannel: getService("@debug").makeChannel("test"),
        options,
      });

      return instance;
    } else {
      throw new Error(`Expected a Service. Received: ${service}`);
    }
  });
}
