import { isObject, isFunction } from "../helpers/typeChecking.js";
import { initService } from "../helpers/initService.js";
import { makeDebug } from "../makeDebug.js";

import HTTPService from "../services/@http.js";
import PageService from "../services/@page.js";

import MockRouterService from "./MockRouterService.js";

/**
 * Wraps a component with a set of mock services. Returns a function that
 * can be initialized the same way as a regular component function.
 */
export function wrapComponent(component, configure) {
  const debug = makeDebug({ filter: "*" });
  const services = {};

  const getService = (name) => {
    if (services[name]) {
      return services[name];
    }

    throw new Error(`Service is not registered in this wrapper. Received: ${name}`);
  };

  const appContext = { getService };

  const helpers = {
    /**
     * Registers a new service for this container.
     *
     * @param name - Key by which to access the service
     * @param service - Function to create the service, or an object to set directly.
     */
    service(name, service, options = {}) {
      if (isFunction(service)) {
        services[name] = initService(appContext, service, debug.makeChannel(name), options);
      } else if (isObject(service)) {
        services[name] = service;
      } else {
        throw new TypeError(`Expected a service function or object for service ${name}. Received: ${service}`);
      }

      return self;
    },
  };

  helpers.service("@app", appContext);
  helpers.service("@debug", debug);
  helpers.service("@http", HTTPService, {
    fetch: () => {
      throw new Error(`Pass a mock @http service to make HTTP requests inside a wrapper.`);
    },
  });
  helpers.service("@page", PageService);
  helpers.service("@router", MockRouterService);

  if (isFunction(configure)) {
    configure.call(helpers, helpers);
  }

  function WrappedComponent($attrs, self) {
    return component($attrs, {
      ...self,
      getService,
    });
  }

  WrappedComponent.isWrapped = true;
  WrappedComponent.getService = getService;

  return WrappedComponent;
}
