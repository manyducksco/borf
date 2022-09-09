import { makeDebug } from "../makeDebug.js";
import { makeMockFetch } from "./makeMockFetch.js";
import { HTTPService } from "../services/http.js";
import { initService } from "../helpers/initService.js";

/**
 * @example
 * import { makeMockHTTP, wrapComponent } from "@woofjs/client/testing";
 *
 * // Create a mock HTTP instance
 * const http = makeMockHTTP(function () {
 *   this.get("/example/route", (ctx) => {
 *     return {
 *       message: "success"
 *     };
 *   });
 *
 *   this.post("/users/:id", (ctx) => {
 *     ctx.response.status = 200;
 *
 *     return {
 *       message: "user created"
 *     };
 *   });
 * });
 *
 * const createComponent = wrapComponent(TestComponent, function () {
 *   this.service("http", http);
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

    return initService(HTTPService, { appContext, name: "http" }).exports;
  };
}
