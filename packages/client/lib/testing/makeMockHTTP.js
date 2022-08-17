import { makeDebug } from "../makeDebug.js";
import { makeMockFetch } from "./makeMockFetch.js";
import http from "../services/http.js";

/**
 * @example
 * import { makeMockHTTP, wrapComponent } from "@woofjs/client/testing";
 *
 * // Create a mock HTTP instance
 * const http = makeMockHTTP((self) => {
 *   self.get("/example/route", (ctx) => {
 *     return {
 *       message: "success"
 *     };
 *   });
 *
 *   self.post("/users/:id", (ctx) => {
 *     ctx.response.status = 200;
 *
 *     return {
 *       message: "user created"
 *     };
 *   });
 * });
 *
 * const createComponent = wrapComponent(TestComponent, {
 *   services: {
 *     http
 *   }
 * });
 */
export function makeMockHTTP(fn) {
  const fetch = makeMockFetch(fn);

  return function () {
    const appContext = {
      services: {},
      options: {
        http: {
          _fetch: fetch,
        },
      },
      debug: makeDebug({ filter: "-woof:*" }),
    };

    return http.init({ appContext, name: "http" });
  };
}
