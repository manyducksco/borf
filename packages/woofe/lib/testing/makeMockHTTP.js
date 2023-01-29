import { makeMockFetch } from "./makeMockFetch.js";
import { makeDebug } from "../helpers/makeDebug.js";
import HTTPGlobal from "../globals/@http.js";
import { Global } from "../classes/Global.js";

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

    return new Global({ setup: http, appContext, channelPrefix: "mock:global", label: "http" }).exports;
    // return initGlobal(http, { appContext, channelPrefix: "mock:global", name: "http" }).exports;
  };
}
