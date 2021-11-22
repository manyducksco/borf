import { makeMockHTTP } from "./makeMockHTTP";

/**
 * Returns a constructor function to create a new service with the mock injectables defined in `options`.
 *
 * @param service - A service class
 * @param options - Injectable options
 */
export function wrapComponent(service, options = {}) {
  return function () {
    const instance = new service();
    const mockHTTP = makeMockHTTP(options.http?.routes || []);

    instance.app = {
      title: "Test Wrapper",
      path: "/test",
      route: "/test",
      params: {},
      query: {},
      ...options,
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

    if (instance.created instanceof Function) {
      instance.created();
    }

    return instance;
  };
}
