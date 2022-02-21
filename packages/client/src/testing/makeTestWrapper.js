import { createMemoryHistory } from "history";
import { isFunction, isService } from "../helpers/typeChecking.js";
import { makeDebug } from "../makeDebug.js";
import { makeService } from "../makeService.js";
import HTTPService from "../services/@http.js";
import PageService from "../services/@page.js";
import RouterService from "../services/@router.js";

export function makeTestWrapper(configure, init) {
  const services = {};
  const getService = (name) => {
    if (services[name]) {
      return services[name];
    }

    throw new Error(`Service is not registered in this wrapper. Received: ${name}`);
  };

  return function makeWrapped(...args) {
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

    const self = {
      /**
       * Registers a new service for this container.
       *
       * @param name - Key by which to access the service
       * @param service- Class or function to create the service, or an object to set directly.
       */
      service(name, service, options = {}) {
        if (isFunction(service)) {
          service = makeService(service);
        }

        if (isService(service)) {
          services[name] = service.create({
            getService,
            debugChannel: debug.makeChannel(`service:${name}`),
            options: options,
          });
        } else {
          throw new TypeError(`Expected a service, function or object for service ${name}. Received: ${service}`);
        }

        return self;
      },
    };

    configure(self);

    return init(getService, ...args);
  };
}
