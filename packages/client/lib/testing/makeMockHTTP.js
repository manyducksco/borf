import { makeMockFetch } from "./makeMockFetch.js";
import { initGlobal } from "../global/helpers/initGlobal.js";

import { makeDebug } from "../helpers/makeDebug.js";

import http from "../global/built-ins/http.js";

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
      globals: {},
      options: {
        http: {
          _fetch: fetch,
        },
      },
      debug: makeDebug(),
    };

    return initGlobal(http, { appContext, channelPrefix: "mock:global", name: "http" }).exports;
  };
}
