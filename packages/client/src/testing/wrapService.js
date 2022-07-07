import { isObject, isFunction } from "../helpers/typeChecking.js";
import { initService } from "../helpers/initService.js";
import { makeDebug } from "../makeDebug.js";

import HTTPService from "../services/http.js";
import PageService from "../services/page.js";

import MockRouterService from "./MockRouterService.js";

/**
 * Wraps a service with a set of mock services.
 */
export function wrapService(service, configure) {
  const debug = makeDebug({ filter: "*,-woof:*" });
  const registeredServices = {};

  const appContext = {
    services: {},
  };

  const helpers = {
    /**
     * Registers a new service for this container.
     *
     * @param name - Key by which to access the service
     * @param service - Function to create the service, or an object to set directly.
     */
    service(name, service, options = {}) {
      if (isFunction(service)) {
        registeredServices[name] = initService(appContext, service, debug.makeChannel(`service:${name}`), {
          name,
          options,
        });
        appContext.services[name] = registeredServices[name].exports;
      } else if (isObject(service)) {
        registeredServices[name] = {
          exports: service,
        };
        appContext.services[name] = service;
      } else {
        throw new TypeError(`Expected a service function or object for service ${name}. Received: ${service}`);
      }

      return helpers;
    },
  };

  helpers.service("app", appContext);
  helpers.service("page", PageService);
  helpers.service("router", MockRouterService);
  helpers.service("http", HTTPService, {
    fetch: () => {
      throw new Error(`Pass a mock http service to make HTTP requests inside a wrapper.`);
    },
  });

  if (isFunction(configure)) {
    configure.call(helpers, helpers);
  }

  return function makeWrapped(options = {}) {
    return initService(appContext, service, debug.makeChannel(`service:wrapped`), { options });
  };
}
