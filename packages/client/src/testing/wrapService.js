/**
 * Returns a constructor function to create a new service with the mock injectables defined in `options`.
 *
 * @param service - A service class
 * @param options - Injectable options
 */
export function wrapService(service, options = {}) {
  const instance = new service();
  const mock = {
    http: {
      calls: [],
    },
  };

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

  options.http.routes; // list of route handlers needs to be used in mock fetch

  const routes = options.http?.routes || [];

  async function mockFetch(url, options = {}) {}

  instance.http = new HTTP({
    fetch: mockFetch,
  });

  if (instance.created instanceof Function) {
    instance.created();
  }

  instance._mock = mock;

  return instance;
}
