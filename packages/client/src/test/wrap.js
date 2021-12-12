import { createMemoryHistory } from "history";
import { isFunction, isObject } from "../_helpers/typeChecking";
import { makeDolla } from "../main/dolla/Dolla";

import Debug from "../main/services/@debug";
import HTTP from "../main/services/@http";
import Router from "../main/services/@router";
import Page from "../main/services/@page";

/**
 * Wraps a component or service inside a mock app container.
 *
 */
export function wrap(object) {
  const _services = {};
  let setup = () => {};

  return {
    /**
     * Registers a new service for this container.
     *
     * @param name - Key by which to access the service
     * @param service- Class or function to create the service, or an object to set directly.
     */
    service(name, service) {
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

      return this;
    },

    /**
     * Receives the app object for configuration.
     * Runs after all services are created but before the object is instantiated.
     */
    setup(fn) {
      setup = fn;

      return this;
    },

    /**
     * Returns a function to create the wrapped object.
     * Takes parameters and children if object is a component.
     * Takes nothing if object is a service.
     */
    create: function () {
      return function (...args) {
        const history = createMemoryHistory();
        const services = {};

        const getService = (name) => {
          if (services[name]) {
            return services[name];
          }

          throw new Error(``);
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

        if (object.isComponent) {
          let attributes = {};
          let children = [];

          if (isObject(args[0]) && !args[0].$isNode) {
            attributes = args.shift();
          }

          children = [...args];

          const $ = makeDolla({
            getService,
            route: {
              route: "test",
              params: {},
              wildcard: null,
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
          throw new Error(
            `Expected a Component or Service. Received: ${object}`
          );
        }
      };
    },
  };
}
