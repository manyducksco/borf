import { createMemoryHistory } from "history";
import { isFunction, isObject } from "../helpers/typeChecking.js";
import { makeDebug } from "../debug/makeDebug.js";
import HTTPService from "../services/@http.js";
import PageService from "../services/@page.js";

export function makeTestWrapper(init) {
  const _services = {};
  let setup = () => {};

  function makeWrapped(...args) {
    const history = createMemoryHistory();
    const debug = makeDebug({ filter: "*" });
    const services = {};

    const getService = (name) => {
      if (services[name]) {
        return services[name];
      }

      throw new Error(`Service is not registered in this wrapper. Received: ${name}`);
    };

    services["@debug"] = debug;
    services["@http"] = HTTPService.create({
      getService,
      debug: debug.makeChannel("woof:@http"),
      options: {
        fetch: () => {
          throw new Error(`Pass a mock @http service to make HTTP requests inside a wrapper.`);
        },
      },
    });
    services["@page"] = PageService.create({
      getService,
      debug: debug.makeChannel("woof:@page"),
    });

    for (const name in _services) {
      services[name] = _services[name]();
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
      _services[name] = () =>
        service.create({
          getService,
          debug: debug.makeChannel(`service:${name}`),
          options: options,
        });
    } else if (isObject(service)) {
      _services[name] = () => service;
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
