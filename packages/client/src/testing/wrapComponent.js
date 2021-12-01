import { makeMockHTTP } from "./makeMockHTTP";
import { makeDolla } from "../templating/Dolla";

/**
 * Returns a constructor function to create a new service with the mock injectables defined in `options`.
 *
 * @param component - A component
 * @param options - Injectable options
 */
export function wrapComponent(component, options = {}) {
  if (component == null) {
    throw new TypeError(`Expected a component. Received: ${component}`);
  }

  options = {
    ...options,
  };

  function create(attributes = {}, ...children) {
    const app = {
      title: "Test Wrapper",
      path: "/test",
      route: "/test",
      params: {},
      query: {},
      ...(options.app || {}),
      services(name) {
        if (options.app?.services[name]) {
          return options.app.services[name];
        }

        throw new Error(`Unregistered service requested. Received: ${name}`);
      },
    };
    const mockHTTP = makeMockHTTP(options.http?.routes || []);
    const $ = makeDolla({
      app,
      http: mockHTTP.http,
      route: {
        route: "/test",
        params: {},
        wildcard: false,
      },
    });

    const instance = new component(attributes, children);
    instance.app = app;
    instance.http = mockHTTP.http;
    instance.$ = $;

    instance._mock = {
      http: mockHTTP.stats,
    };

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
