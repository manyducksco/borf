import { createMemoryHistory } from "history";
import { isFunction } from "../helpers/typeChecking.js";
import { makeDebug } from "../debug/makeDebug.js";
import { makeService } from "../makeService.js";
import HTTPService from "../services/@http.js";
import PageService from "../services/@page.js";
import RouterService from "../services/@router.js";

export function makeTestWrapper(init) {
  const injectedServices = {};
  let setup = () => {};

  const services = {};
  const getService = (name) => {
    if (services[name]) {
      return services[name];
    }

    throw new Error(`Service is not registered in this wrapper. Received: ${name}`);
  };

  function makeWrapped(...args) {
    const debug = makeDebug({ filter: "*" });

    services["@debug"] = debug;
    services["@http"] = HTTPService.create({
      getService,
      debugChannel: debug.makeChannel("woof:@http"),
      options: {
        fetch: () => {
          throw new Error(`Pass a mock @http service to make HTTP requests inside a wrapper.`);
        },
      },
    });
    services["@page"] = PageService.create({
      getService,
      debugChannel: debug.makeChannel("woof:@page"),
    });
    services["@router"] = RouterService.create({
      getService,
      debugChannel: debug.makeChannel("woof:@router"),
      options: {
        history: createMemoryHistory(),
      },
    });

    for (const name in injectedServices) {
      services[name] = injectedServices[name]();
    }

    setup(getService);

    return init(getService, ...args);
  }

  /**
   * Registers a new service for this container.
   *
   * @param name - Key by which to access the service
   * @param service- Class or function to create the service, or an object to set directly.
   */
  makeWrapped.service = function (name, service, options = {}) {
    if (isFunction(service)) {
      service = makeService(service);
    }

    if (service.isService) {
      injectedServices[name] = () =>
        service.create({
          getService,
          debugChannel: debug.makeChannel(`service:${name}`),
          options: options,
        });
    } else {
      throw new TypeError(`Expected a service, function or object for service ${name}. Received: ${service}`);
    }

    return makeWrapped;
  };

  /**
   * Receives the app object for configuration.
   * Runs after all services are created but before the object is instantiated.
   */
  makeWrapped.setup = function (fn) {
    setup = fn;

    return makeWrapped;
  };

  /**
   * Alias for calling the function directly. This looks more readable at the end of a chain of functions.
   *
   * @param args - Attributes and/or children for the wrapped component.
   */
  makeWrapped.create = function (...args) {
    return makeWrapped(...args);
  };

  return makeWrapped;
}
