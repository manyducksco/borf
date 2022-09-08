import { isObject, isFunction, isService } from "../helpers/typeChecking.js";
import { makeDebug } from "../makeDebug.js";
import { makeService } from "../makeService.js";

import MockHTTPService from "./mocks/MockHTTPService.js";
import MockPageService from "./mocks/MockPageService.js";
import MockRouterService from "./mocks/MockRouterService.js";

/**
 * Creates a service in a mock container for testing purposes.
 */
export function wrapService(service, configFn) {
  if (isFunction(service)) {
    service = makeService(service);
  }

  if (!isService(service)) {
    throw new Error(`Expected a service or service function as the first argument.`);
  }

  const appContext = {
    services: {
      router: MockRouterService,
      page: MockPageService,
      http: MockHTTPService,
    },
    options: {},
    debug: makeDebug({ filter: "*,-woof:*" }),
  };

  const configContext = {
    service(name, service) {
      if (isObject(service) && !isService(service)) {
        service = () => service;
      }

      if (isFunction(service)) {
        service = makeService(service);
      }

      if (!isService(service)) {
        throw new Error(`Expected a service, service function or plain object for service '${name}'`);
      }

      appContext.services[name] = service.init({ appContext, name });
    },
  };

  configFn(configContext);

  return {
    exports: service.init({ appContext, name: "wrapped" }),
    beforeConnect: service.beforeConnect,
    afterConnect: service.afterConnect,
  };
}
