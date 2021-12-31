import { createMemoryHistory } from "history";
import {
  isComponent,
  isFunction,
  isNode,
  isObject,
} from "../_helpers/typeChecking";
import { makeDolla } from "../main/dolla/Dolla";

import Debug from "../main/services/@debug";
import HTTP from "../main/services/@http";
import Router from "../main/services/@router";
import Page from "../main/services/@page";
import { makeState } from "../main/state/makeState";

/**
 * Wraps a component or service inside a mock app container.
 *
 */
export function wrap(object) {
  const _services = {};
  let setup = () => {};

  function makeWrapped(...args) {
    const history = createMemoryHistory();
    const services = {};

    const getService = (name) => {
      if (services[name]) {
        return services[name];
      }

      throw new Error(
        `Service is not registered in this wrapper. Received: ${name}`
      );
    };

    services["@debug"] = new Debug(getService);
    services["@http"] = new (class extends HTTP {
      request() {
        throw new Error(
          `Tried to make HTTP request in a wrapped component or service. Supply a mock @http service to define the mock responses you need for testing.`
        );
      }
    })();
    services["@router"] = new Router(getService);
    services["@page"] = new Page(getService);

    services["@debug"].setFilter("*");

    for (const name in _services) {
      services[name] = _services[name](getService);

      if (isFunction(services[name]._created)) {
        if (name === "@router") {
          services[name]._created({ history });
        } else {
          services[name]._created();
        }
      }
    }

    setup(getService);

    if (isComponent(object)) {
      let attributes = {};
      let children = [];

      if (isObject(args[0]) && !isNode(args[0])) {
        attributes = args.shift();
      }

      children = [...args];

      const $ = makeDolla({
        getService,
        match: {
          route: makeState("test", { settable: false }),
          params: makeState({}, { settable: false }),
          wildcard: makeState(null, { settable: false }),
        },
      });

      return new object(getService, $, attributes, children);
    } else if (object.isService) {
      const service = new object(getService);

      if (isFunction(service._created)) {
        service._created();
      }

      return service;
    } else {
      throw new Error(`Expected a Component or Service. Received: ${object}`);
    }
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
      throw new TypeError(
        `Expected a service, function or object for service ${name}. Received: ${service}`
      );
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
