import { makeState } from "@woofjs/state";
import { createMemoryHistory } from "history";
import { initService } from "../helpers/initService.js";
import { isFunction, isObject } from "../helpers/typeChecking.js";
import { makeDebug } from "../makeDebug.js";

import HTTPService from "../services/@http.js";
import PageService from "../services/@page.js";

function MockRouterService() {
  const $path = makeState("/test");
  const $route = makeState("/test");
  const $params = makeState({});
  const $query = makeState({});

  return {
    $path: $path.map(),
    $route: $route.map(),
    $params: $params.map(),
    $query,

    back() {},
    forward() {},
    navigate() {},
  };
}

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

    const appContext = { getService };

    services["@app"] = appContext;
    services["@debug"] = debug;
    services["@http"] = initService(appContext, HTTPService, debug.makeChannel("woof:@http"), {
      fetch: () => {
        throw new Error(`Pass a mock @http service to make HTTP requests inside a wrapper.`);
      },
    });
    services["@page"] = initService(appContext, PageService, debug.makeChannel("woof:@page"));
    services["@router"] = initService(appContext, MockRouterService, debug.makeChannel("woof:@router"), {
      history: createMemoryHistory(),
    });

    const self = {
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

    configure(self);

    return init(getService, ...args);
  };
}
