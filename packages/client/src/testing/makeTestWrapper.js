import { createMemoryHistory } from "history";
import { isFunction, isObject } from "../helpers/typeChecking.js";
import { makeDebug } from "../debug/makeDebug.js";
import HTTP from "../services/@http.js";
import Page from "../services/@page.js";

export function makeTestWrapper(init) {
  const _services = {};
  let setup = () => {};

  function makeWrapped(...args) {
    const history = createMemoryHistory();
    const services = {};

    const getService = (name) => {
      if (services[name]) {
        return services[name];
      }

      throw new Error(`Service is not registered in this wrapper. Received: ${name}`);
    };

    services["@debug"] = new Debug(getService);
    services["@http"] = new (class extends HTTP {
      request() {
        throw new Error(
          `Tried to make HTTP request in a wrapped component or service. Supply a mock @http service to define the mock responses you need for testing.`
        );
      }
    })();
    services["@page"] = new Page(getService);

    services["@debug"] = () => makeDebug({ filter: "*" });

    for (const name in _services) {
      services[name] = _services[name](getService);

      if (isFunction(services[name]._created)) {
        if (name === "@page") {
          services[name]._created({ history });
        } else {
          services[name]._created();
        }
      }
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
  makeWrapped.service = function (name, service) {
    if (service.isService) {
      _services[name] = (getService) => new service(getService);
    } else if (isFunction(service)) {
      _services[name] = (getService) => service(getService);
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
