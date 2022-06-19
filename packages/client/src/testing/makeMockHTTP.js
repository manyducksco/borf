import http from "../services/@http.js";
import { makeMockFetch } from "./makeMockFetch.js";

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
 * const createComponent = wrapComponent(TestComponent, (self) => {
 *   self.service("@http", http);
 * });
 */
export function makeMockHTTP(fn) {
  const fetch = makeMockFetch(fn);

  return function (self) {
    return http({
      ...self,
      options: {
        ...self.options,
        fetch,
      },
    });
  };
}
