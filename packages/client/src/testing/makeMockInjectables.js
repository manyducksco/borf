import { makeMockHTTP } from "./makeMockHTTP";
import { makeDolla } from "../templating/Dolla";
import { isFunction } from "../_helpers/typeChecking";

export function makeMockInjectables(options = {}) {
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

  return {
    $,
    app,
    http: mockHTTP.http,
  };
}
