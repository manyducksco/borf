import { isFunction } from "../helpers/typeChecking.js";
import { makeDebug } from "../makeDebug.js";
import { initService } from "../helpers/initService.js";

import { MockHTTPService } from "./mocks/MockHTTPService.js";
import { MockPageService } from "./mocks/MockPageService.js";
import { MockRouterService } from "./mocks/MockRouterService.js";

/**
 * Creates a service in a mock container for testing purposes.
 */
export function wrapService(serviceFn, configFn) {
  if (!isFunction(serviceFn)) {
    throw new Error(`Expected a service function as the first argument.`);
  }

  const appContext = {
    services: {},
    options: {},
    debug: makeDebug({ filter: "*,-woof:*" }),
  };

  const onBeforeConnect = [];
  const onAfterConnect = [];

  const ctx = {
    service(name, service) {
      if (!isFunction(service)) {
        throw new Error(`Expected a service function for '${name}'`);
      }

      const svc = initService(service, { appContext, name });
      appContext.services[name] = svc.exports;

      onBeforeConnect.push(svc.beforeConnect);
      onAfterConnect.push(svc.afterConnect);

      return ctx;
    },
  };

  ctx.service("router", MockRouterService);
  ctx.service("page", MockPageService);
  ctx.service("http", MockHTTPService);

  for (const callback of onBeforeConnect) {
    callback();
  }

  configFn.call(ctx);

  for (const callback of onAfterConnect) {
    callback();
  }

  return initService(serviceFn, { appContext, name: "wrapped" });
}
