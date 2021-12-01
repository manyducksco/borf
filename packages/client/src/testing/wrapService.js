import { isFunction } from "../_helpers/typeChecking";
import { makeMockHTTP, route } from "./makeMockHTTP";

/**
 * Returns a constructor function to create a new service with the mock injectables defined in `options`.
 *
 * @param service - A service class
 * @param options - Injectable options
 */
export function wrapService(service, options = {}) {
  options = {
    ...options,
  };

  function create() {
    const instance = new service();
    const mockHTTP = makeMockHTTP(options.http?.routes || []);

    instance.app = {
      title: "Test Wrapper",
      path: "/test",
      route: "/test",
      params: {},
      query: {},
      ...(options?.app || {}),
      services(name) {
        if (options.app?.services[name]) {
          return options.app.services[name];
        }

        throw new Error(`Unregistered service requested. Received: ${name}`);
      },
    };

    instance.http = mockHTTP.http;
    instance._mock = {
      http: mockHTTP.stats,
    };

    if (isFunction(instance.created)) {
      instance.created();
    }

    return instance;
  }

  create.mockResponse = function (config) {
    if (!options.http) {
      options.http = {};
    }

    if (!options.http.routes) {
      options.http.routes = [];
    }

    const method = config.method?.toLowerCase();
    const handler = route[method];

    if (handler == null) {
      throw new Error(`Expected known HTTP method. Received: ${method}`);
    }

    options.http.routes.push(handler(config.path, config.respond));

    return create;
  };

  create.mockService = function (name, instance) {
    if (!options.app) {
      options.app = {};
    }

    if (!options.app.services) {
      options.app.services = {};
    }

    options.app.services[name] = instance;

    return create;
  };

  return create;
}
